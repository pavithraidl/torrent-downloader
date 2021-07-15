/**
 * Manage all file handling functions
 * ---------------------------------------------------------------------------------------------------------------------
 * @type {module:fs}
 */
const fs = require('fs');
const path = require('path');
const ignoredFiles = ['.DS_Store', 'node_modules'];

module.exports = {
  /**
   * Get the project root path
   *
   * @return {string}
   */
  projectRootPath: () => {
    const binFolderPath = path.resolve(__dirname);
    if (binFolderPath) {
      return binFolderPath.replace('/core_lib', '');
    }
    return binFolderPath;
  },

  /**
   * Get Path to the working dir
   *
   * @return {string}
   */
  getPwa: () => {
    return process.cwd();
  },

  /**
   * Get the name of the working dir
   *
   * @return {string}
   */
  getCwd: () => {
    return path.basename(process.cwd());
  },

  /**
   * Check the directory is exists on the given filePath
   *
   * @param filePath
   * @return {boolean}
   */
  isExists: (filePath) => {
    return fs.existsSync(filePath);
  },

  /**
   * Create a new directory on the given path
   *
   * @param filePath
   * @return {boolean}
   */
  mkDir: (filePath) => {
    const folderName = filePath;

    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  /**
   * Check whether the given dir is empty or not
   *
   * @param filePath
   * @return {Promise<boolean>}
   */
  isDirEmpty: (filePath) => {
    return fs.promises.readdir(filePath).then((files) => {
      return files.filter(file => file !== '.DS_Store').length === 0;
    });
  },

  /**
   * Check whether the given dir is empty or not
   *
   * @param filePath
   * @return {Promise<boolean>}
   */
  getDirList: (filePath) => {
    try {
      return fs.promises.readdir(filePath).then((files) => {
        return files.filter(file => !ignoredFiles.includes(file));
      });
    } catch (err) {
      return new Promise((resolve) => {
        resolve(err);
      });
    }
  },

  /**
   * Clone a directory to the given target
   *
   * @param sourceFilePath
   * @param targetFilePath
   * @param rootCall
   */
  cloneDir: (sourceFilePath, targetFilePath, rootCall = true) => {
    return new Promise((resolve) => {
      let files = [];

      // Check if folder needs to be created or integrated
      let targetFolder = path.join(targetFilePath, path.basename(sourceFilePath));
      if (rootCall) {
        targetFolder = targetFilePath;
      }

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
      }

      // Copy
      if (fs.lstatSync(sourceFilePath).isDirectory()) {
        files = fs.readdirSync(sourceFilePath);
        files.forEach(function (file) {
          if (!ignoredFiles.includes(file)) {
            const curSource = path.join(sourceFilePath, file);
            if (fs.lstatSync(curSource).isDirectory()) {
              module.exports.cloneDir(curSource, targetFolder, false);
            } else {
              // clone the files recursively to the new directory
              module.exports.cloneRecursive(curSource, targetFolder);
            }
          }
        });
      }

      resolve(true);
    });
  },

  /**
   * Clone file recursively
   * @param sourceFilePath
   * @param targetFilePath
   */
  cloneRecursive: (sourceFilePath, targetFilePath) => {
    let targetFile = targetFilePath;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(targetFilePath)) {
      if (fs.lstatSync(targetFilePath).isDirectory()) {
        targetFile = path.join(targetFilePath, path.basename(sourceFilePath));
      }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(sourceFilePath));
  },

  /**
   * Write the given content to the file
   *
   * @param filePath
   */
  createAFile: (filePath) => {
    try {
      fs.open(filePath, 'w', (err) => {
        if (err) { console.error(err); }
        return true;
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  /**
   * Write the given content to the file
   *
   * @param filePath
   * @param content
   */
  writeFile: (filePath, content) => {
    try {
      fs.writeFile(filePath, content, (err) => {
        if (err) { console.error(err); }
        return true;
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  /**
   * Write the given content to the file
   *
   * @param filePath
   */
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.log(err);
      return null;
    }
  },
};
