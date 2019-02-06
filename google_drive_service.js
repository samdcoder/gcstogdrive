const {google} = require('googleapis');
const fs = require('fs');
const key = require('./gdrive_service.json');
const folderId = '1oKs1GTSvOQCcPMaN43x9pCfjq3opbBel';

//below is gcs stuff
const {Storage} = require('@google-cloud/storage');
const bucketName = 'pubsite_prod_rev_11600216524546064647';
const projectId = 'houm-core';
const mime = require('mime-types');

const storage = new Storage({
  projectId: projectId
});

async function listGcsFiles(auth){
  try{
    const [files] = await storage.bucket(bucketName).getFiles();
    for(var i = 0; i < files.length; i++){
      let file = files[i];
      //console.log("uploading file: ", file.name);
      let folderId = await getFolderId(file.name);
      let fileInfo = {
        'name': file.name,
        'mime-type': mime.lookup(file.name),
        'folderId': folderId
      };
      console.log('uploading: ', file.name);
      let localFilename = 'temp';
      file.createReadStream()
      .on('error', function(err) {
        console.log("In error of fileStream: ", err);
      })
      .on('response', async function(response) {
        // Server connected and responded with the specified status and headers.
        await saveFileToDrive(auth,fileInfo,response);
       })
      .on('end', function() {
        // The file is fully downloaded.
      })
      .pipe(fs.createWriteStream(localFilename));
    }
  }
  catch(e){
    console.log("error: ", e);
  }
}
//above is gcs stuff


const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.metadata.readonly'],
  null
);

jwtClient.authorize(async(authErr) => {
  if (authErr) {
    console.log(authErr);
    return;
  }
  const drive = google.drive({version: 'v3', auth: jwtClient});
  await listGcsFiles(jwtClient);
  // Make an authorized requests

  // List Drive files.
  /*drive.files.list((listErr, resp) => {
    if (listErr) {
      console.log(listErr);
      return;
    }

    resp.data.files.forEach((file) => {
      console.log(`${file.name} (${file.mimeType})`);
    });
  }); */
  //upload file to drive after listing it from gcs
    /*
    var fileMetadata = {
    'name': 'photo.jpg',
    parents: ['1oKs1GTSvOQCcPMaN43x9pCfjq3opbBel']
    };
    var media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream('./photo.jpg')
    };

    drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
    }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('File Id: ', file.id);
    }
  }); */
});

async function saveFileToDrive(auth, fileInfo, fileStream){
  const drive = google.drive({version: 'v3', auth});
  let currentName = fileInfo.name;
  const name = currentName.substring(currentName.lastIndexOf('/')+1, currentName.length);
  var fileMetadata = {
  'name': name,
  'mimeType': fileInfo['mime-type'],
  parents: [fileInfo.folderId]
  };
  var media = {
    mimeType: fileInfo['mime-type'],
    body: fileStream
  };
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      console.log("In the error for file=> ", fileInfo);
      console.error(err);
    } else {
      console.log('File Id:', file.id);
    }
  });
}

async function getFolderId(fileName){
  //map of path to folder id
  //folder id needs to be changed in this method after new folders are manually created on actual account in google drive
  let keyName = fileName.substring(0, fileName.lastIndexOf('/'));

  const folderIdMap = {
    'stats/ratings': '1Z9KwfEyPprZNC684QiXBumVFfubKFE-H',
    'stats/installs': '19Zj2PFHLunNnlQ9GZwzfymdydwmYcZ-e',
    'stats/crashes': '1qovkLHNAzuBljQ9SphDCIileX0-XT1p9',
    'reviews': '1NGNgbCaKYdWbabqksSBTvO-jXF656sRz',
    'acquisition/retained_installers': '12zxAMEMZplqWRIBp_47IEhw8y6UVWhlg',
    'acquisition/buyers_7d': '11Ee9_OpVBPTPtAwpowEtbI708lfcEZBQ'
  }
  return folderIdMap[keyName];
}
