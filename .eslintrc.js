module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "chrome": false,
        "moment": false,
        "_": false,
        "$": false
    },
    "rules": {
        "comma-dangle": ["error", "always-multiline"],
        "semi": ["error", "always"],
        "quotes": ["error", "single"],
        "no-tabs": "off",
        "indent": ["error", "tab"],
        "space-before-blocks": "off",
        "handle-callback-err": "off",
        "space-before-function-paren": "off",
        "no-return-assign": "off",
        "space-in-parens": "off",
        "no-dupe-keys": "off",
        "spaced-comment": "off",
        "linebreak-style": [
            "error",
            "unix"
        ]
    }
};
