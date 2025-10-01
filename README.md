
# Support for generate svgs, images, errors, themes, storages
```sh
npm install react-native-fast-scripts
```
in scripts
```js
"scripts": {
    "gen:svgs": "npx react-native-fast-scripts gen:svgs --dir './src/shared/assets/svgs'",
    "gen:images": "npx react-native-fast-scripts gen:images --dir './src/shared/assets/images'",
    "gen:errors": "npx react-native-fast-scripts gen:errors --dir './src/shared/assets/errors'",
    "gen:storage": "npx react-native-fast-scripts gen:storage --mmkv --asyncstorage --dir './src/shared/storages'",
    "gen:theme": "npx react-native-fast-scripts gen:theme --light --dark --dir './src/shared/themes'",
}
```