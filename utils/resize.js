const sharp = require('sharp');

module.exports = (config) => {
	console.log('cofig obj', config);
	return sharp(config.path)
		.resize(config.width, config.height)
		.toFile(config.outputName);
}; // { width: 100, height: 100, border:... }