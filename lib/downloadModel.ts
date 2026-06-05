import { Platform } from 'react-native';
import { addModelToStorage } from './modelStorage';

let RNFS: any = null;
if (Platform.OS !== 'web') {
  RNFS = require('react-native-fs');
}

export const downloadModel = async (
  modelName: string,
  modelUrl: string,
  onProgress: (progress: number) => void,
  forceRedownload: boolean = false,
  modelFormat?: string
): Promise<string> => {
  if (!RNFS) {
    throw new Error('File system operations are not available on this platform');
  }

  const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
  try {
    if (!modelName || !modelUrl) {
      throw new Error('Invalid model name or URL');
    }

    const fileExists = await RNFS.exists(destPath);

    if (fileExists && !forceRedownload) {
      console.log(`Model already exists at ${destPath}, skipping download`);
      onProgress(100);
      return destPath;
    }

    if (fileExists && forceRedownload) {
      await RNFS.unlink(destPath);
      console.log(`Deleted existing file at ${destPath} for re-download`);
    }

    console.log("Starting download from:", modelUrl);
    const downloadResult = await RNFS.downloadFile({
      fromUrl: modelUrl,
      toFile: destPath,
      progressDivider: 5,
      begin: (res: any) => {
        console.log("Download started:", res);
      },
      progress: ({ bytesWritten, contentLength }: { bytesWritten: number; contentLength: number }) => {
        const progress = (bytesWritten / contentLength) * 100;
        console.log("Download progress:", progress);
        onProgress(Math.floor(progress));
      },
    }).promise;

    if (downloadResult.statusCode === 200) {
      let fileSize = 0;
      try {
        const fileStats = await RNFS.stat(destPath);
        fileSize = fileStats.size;
      } catch (e) {
        console.error('Error getting file size:', e);
      }

      try {
        await addModelToStorage({
          modelName,
          modelPath: destPath,
          fileSize,
          downloadedAt: new Date().toISOString(),
          modelFormat: modelFormat || 'Unknown',
        });
      } catch (storageError) {
        console.error('Warning: Failed to register model in storage:', storageError);
      }

      return destPath;
    } else {
      throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    throw new Error(`Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};