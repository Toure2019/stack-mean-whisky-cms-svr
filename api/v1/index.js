const express = require('express');
const router  = express.Router();
const BlogPost = require('../models/blogpost');
const mongoose = require('mongoose');
const multer   = require('multer');
const crypto   = require('crypto');
const path     = require('path');
const resize   = require('../../utils/resize');

router.get('/ping', (req, res) => {
    res.status(200).json({ msg: 'Pong', date: new Date() });
});

router.get('/blog-posts', (req, res) => {
    console.log('req.user', req.user);
    BlogPost.find()
        .sort({ 'createdOn': -1 })
        .exec()
        .then(blogPosts => res.status(200).json(blogPosts))
        .catch(err => res.status(500).json({ message: 'blog posts not found', error: err }));
});

router.get('/blog-posts/:id', (req, res) => {
    const id = req.params.id;
    BlogPost.findById(id)
        .then(blogPost => res.status(200).json(blogPost))
        .catch(err => res.status(500).json({ message: `blog post with id ${id} not found`, error: err }));
});

router.post('/blog-posts', (req, res) => {
    console.log('req.body', req.body);
    // const blogPost = new BlogPost(req.body);
    // const blogPost = new BlogPost({...req.body, image: lastUploadedImageName});
    const smallImagePath = `./uploads/${lastUploadedImageName}`;
    const outputName = `./uploads/small-${lastUploadedImageName}`;
    resize({ path: smallImagePath, width: 200, height: 200, outputName: outputName })
        .then(data => {
            console.log('OK Resize', data.size);
        })
        .catch(err => console.error(err));

    const blogPost = new BlogPost({...req.body, image: lastUploadedImageName, smallImage: `small-${lastUploadedImageName}`});

    blogPost.save((err, blogPost) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.status(201).json(blogPost);
    });
});

router.delete('/blog-posts/:id', (req, res) => {
    console.log('req.isAuthenticated()', req.isAuthenticated());
    req.logOut();   // TODO delete this line
    console.log('req.isAuthenticated()', req.isAuthenticated());

    if (!req.isAuthenticated()) {
        return res.status(401).json({ result: 'KO', message: 'not authorized to delete a blog-post' });
    }
    const id = req.params.id;
    BlogPost.findByIdAndDelete(id, (err, blogPost) => {
        if (err) {
            res.status(500).json(err);
        }
        res.status(202).json({ message: `blog post with id ${id} deleted` });
    })
});

router.delete('/blog-posts', (req, res) => {
    console.log('req.isAuthenticated()', req.isAuthenticated());
    req.logOut();   // TODO delete this line
    console.log('req.isAuthenticated()', req.isAuthenticated());

    if (!req.isAuthenticated()) {
        return res.status(401).json({ result: 'KO', message: 'not authorized to delete a blog-post' });
    }
    const ids = req.query.ids;
    console.log('Query ids', ids);
    const allIds = ids.split(',').map(id => {
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            return mongoose.Types.ObjectId((id))
        } else {
            console.log('id is not valid', id);
        }
    });
    const condition = { _id: { $in: allIds } };
    BlogPost.deleteMany(condition, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.status(202).json(result);
    });  // { nb: 2, ok: true }
});


let lastUploadedImageName = '';
//file upload configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) return callback(err);
            // callback(null, raw.toString('hex') + path.extname(file.originalname));  
            lastUploadedImageName = raw.toString('hex') + path.extname(file.originalname);
            console.log('lastUploadedImageName', lastUploadedImageName);
            callback(null, lastUploadedImageName);
        });
    }
});
const upload = multer({ storage: storage });

// file upload route
router.post('/blog-posts/images', upload.single('image'), (req, res) => {
    if (!req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return res.status(400).json({ message: 'only images files please !' });
    }
    res.status(201).json({ fileName: req.file.filename, file: req.file });
});

router.put('/blog-posts/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const condition = { _id: id };
    const blogpost = { ...req.body, image: lastUploadedImageName };
    const update = { $set: blogpost };
    const options = {
        upsert: true,
        new: true
    };
    BlogPost.findOneAndUpdate(condition, update, options, (err, response) => {
        if (err) return res.status(500).json({ message: 'update failde ', error: err });
        res.status(200).json({ message: `document with id ${id} updated`, response: response });
    });
});

module.exports = router;