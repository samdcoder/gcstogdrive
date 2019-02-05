// get all the files from a bucket
const {Storage} = require('@google-cloud/storage');
const bucketName = 'test-bucket-random';
const projectId = 'houm-host';
const Blob = require('blob');

const storage = new Storage({
  projectId: projectId
});

//listing files in a bucket
async function listFiles(){
  try{
    const [files] = await storage.bucket(bucketName).getFiles();
    console.log("Listing files: ");
    files.forEach(file => {
      //let myblob = new Blob(['hi', 'this', 'is', 'a', 'blob']);
      //console.log("myblob => ", myblob);
      console.log(file.name);

      let remoteStream = file.createReadStream();
      //console.log("remoteStream => ", remoteStream);
    })
  }
  catch(e){
    console.log("error: ", e);
  }
}

//uploading a local file to a bucket
async function uploadFile(fName){
  const fileName = fName;
  try{
      await storage.bucket(bucketName).upload(fileName);
      console.log(`${fileName} successfully uploaded!`);
  }
  catch(e){
    console.log("Error uploading the file: ", e);
  }
}

//download file
async function downloadFile(){
  const options = {
    destination: '../../../../Downloads/sameer.txt'
  }
  try{
    await storage
      .bucket(bucketName)
      .file('test_file.txt')
      .download(options);
      console.log("File downloaded successfully");
  }
  catch(e){
    console.log("Error in downloading the file: ", e);
  }

}
listFiles();
//downloadFile();
//uploadFile('179.ppt');
