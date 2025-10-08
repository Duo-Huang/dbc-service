const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (options) {
    const filename = options.output?.filename || '';
    const appDir = path.dirname(filename);

    return {
        ...options,
        plugins: [
            ...options.plugins,
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'config'),
                        to: path.join(appDir, 'config'),
                    },
                ],
            }),
        ],
    };
};
