import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

let RNFS: any = null;
if (Platform.OS !== 'web') {
  RNFS = require('react-native-fs');
}

export interface ModelMetadata {
  modelName: string;
  modelPath: string;
  fileSize: number;
  downloadedAt: string;
  modelFormat: string;
}

const MODELS_METADATA_FILE = `${FileSystem.documentDirectory}models_metadata.json`;

const readModelsMetadata = async (): Promise<ModelMetadata[]> => {
  try {
    const fileExists = await FileSystem.getInfoAsync(MODELS_METADATA_FILE);
    if (!fileExists.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(MODELS_METADATA_FILE);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading models metadata:', error);
    return [];
  }
};

const writeModelsMetadata = async (models: ModelMetadata[]): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(
      MODELS_METADATA_FILE,
      JSON.stringify(models, null, 2)
    );
  } catch (error) {
    console.error('Error writing models metadata:', error);
    throw error;
  }
};

export const initializeLocalModels = async (): Promise<ModelMetadata[]> => {
  try {
    const models = await readModelsMetadata();
    const validModels: ModelMetadata[] = [];
    
    for (const model of models) {
      if (RNFS) {
        const fileExists = await RNFS.exists(model.modelPath);
        if (fileExists) {
          validModels.push(model);
        } else {
          console.log(`Removing stale model entry: ${model.modelName}`);
        }
      } else {
        validModels.push(model);
      }
    }

    if (validModels.length !== models.length) {
      await writeModelsMetadata(validModels);
    }

    return validModels;
  } catch (error) {
    console.error('Error initializing local models:', error);
    return [];
  }
};

const addModel = async (metadata: ModelMetadata): Promise<void> => {
  try {
    const models = await readModelsMetadata();
    const filtered = models.filter(m => m.modelName !== metadata.modelName);
    filtered.push(metadata);

    await writeModelsMetadata(filtered);
    console.log(`Model added to storage: ${metadata.modelName}`);
  } catch (error) {
    console.error('Error adding model to storage:', error);
    throw error;
  }
};

export const removeModel = async (
  modelName: string,
  deleteFile: boolean = true
): Promise<void> => {
  try {
    const models = await readModelsMetadata();
    const modelToRemove = models.find(m => m.modelName === modelName);

    if (deleteFile && modelToRemove && RNFS) {
      try {
        const fileExists = await RNFS.exists(modelToRemove.modelPath);
        if (fileExists) {
          await RNFS.unlink(modelToRemove.modelPath);
          console.log(`Deleted model file: ${modelToRemove.modelPath}`);
        }
      } catch (error) {
        console.error('Error deleting model file:', error);
      }
    }

    const filtered = models.filter(m => m.modelName !== modelName);
    await writeModelsMetadata(filtered);
    console.log(`Model removed from storage: ${modelName}`);
  } catch (error) {
    console.error('Error removing model from storage:', error);
    throw error;
  }
};

export const addModelToStorage = addModel;
