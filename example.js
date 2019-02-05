/*
###########IMPORTANT##########
Download files from gcs and convert it to stream
Pass that stream to google drive function createFile which will upload it to drive
Do this for every file
*/

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

//below is gcs stuff
const {Storage} = require('@google-cloud/storage');
const bucketName = 'test-bucket-random';
const projectId = 'houm-host';
const mime = require('mime-types');

const storage = new Storage({
  projectId: projectId
});

async function listGcsFiles(auth){
  try{
    const [files] = await storage.bucket(bucketName).getFiles();
    for(var i = 0; i < files.length; i++){
      let file = files[i];
      let fileInfo = {
        'name': file.name,
        'mime-type': mime.lookup(file.name)
      };
      let localFilename = 'temp';
      file.createReadStream()
      .on('error', function(err) {
        console.log("In error of fileStream: ", err);
      })
      .on('response', async function(response) {
        // Server connected and responded with the specified status and headers.
        await saveFileToDrive(auth,fileInfo, response);
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

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listGcsFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
    //createFile(auth);

  });
}

async function saveFileToDrive(auth, fileInfo, fileStream){
  const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
  'name': fileInfo.name,
  'mimeType': fileInfo['mime-type']
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
