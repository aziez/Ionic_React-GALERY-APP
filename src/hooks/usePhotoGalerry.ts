import { useState, useEffect } from "react";
import { isPlatform } from "@ionic/core";

import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Storage } from "@capacitor/storage";
import { Capacitor } from "@capacitor/core";
const PHOTO_STORAGE = "photos";

export function usePhotoGalerry(){
    
    const [photos, setPhotos] = useState<UserPhoto[]>([]);


    const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
        let base64Data: string;

        if(isPlatform ("hybrid")){
            const file = await Filesystem.readFile({
                path: photo.path!,
            });
            base64Data = file.data;
        } else {
            base64Data = await base64FromPath(photo.webPath!);
        }

        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data
        });

        if(isPlatform ("hybrid")){
            return {
                filepath: savedFile.uri,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri),
            };
        } else {
            return {
                filepath: fileName,
                webviewPath: photo.webPath
            };
        }
    };


    const loadSaved = async () => {
        const { value } = await Storage.get({ key: PHOTO_STORAGE });

        const photosInStorage = (value ? JSON.parse(value) : []) as UserPhoto[];

        if(isPlatform ("hybrid")){
            for(let photo of photosInStorage){
                const file = await Filesystem.readFile({
                    path: photo.filepath,
                    directory: Directory.Data
                });

                photo.webviewPath = `data:iamge/jpeg;base64,${file.data}`;

            }
        }
        setPhotos(photosInStorage);
    };


    useEffect(() => {
        const loadSaved = async () => {
            const {value } = await Storage.get({ key: PHOTO_STORAGE });
            const photoInStorage = (value ? JSON.parse(value) : []) as UserPhoto[];

            for (let photo of photoInStorage) {
                const file = await Filesystem.readFile({
                    path: photo.filepath,
                    directory: Directory.Data
                });

                photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
            }
            setPhotos(photoInStorage);
        };
        loadSaved();
    }, []);


        
    const takePhoto = async () => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });

        const fileName =  new Date().getTime() + '.jpeg';
        const savedFileImage = await savePicture(photo, fileName);
        const newPhotos = [
            {
                filepath: fileName,
                webviewPath: photo.webPath
            }, 
            ...photos,
        ];
           
        setPhotos(newPhotos);
        Storage.set({ key : PHOTO_STORAGE, value: JSON.stringify(newPhotos)});
    }

    return {photos, takePhoto};
}

export async function base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            if(typeof reader.result === 'string'){
            resolve(reader.result);
            }else {
                reject('Methd tidak menghasilkan string');
            }
        };
        reader.readAsDataURL(blob);
    });

}


export interface UserPhoto {

    filepath: string;
    webviewPath?: string;
}


