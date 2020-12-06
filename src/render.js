
const cameraSelect = document.getElementById("cameraSelect");

const updateCameraListBtn = document.getElementById("updateCameraListBtn");
updateCameraListBtn.onclick = updateCameraList;

const video = document.getElementById("video");

const remote = require("electron").remote;
const app = remote.app;
const dialog = remote.dialog;
const fs = require('fs');
const node_path = require('path');


function listDevices(mediaDevices){
    const constraints = {video: true};
    cameraSelect.innerHTML = "";
    
    let count = 1;
    mediaDevices.forEach(mediaDevice => {
        if (mediaDevice.kind === 'videoinput') {
          const option = document.createElement('option');
          option.value = mediaDevice.deviceId;
          const label = mediaDevice.label || `Camera ${count++}`;
          const textNode = document.createTextNode(label);
          option.appendChild(textNode);
          cameraSelect.appendChild(option);
          lastCamera = mediaDevice.deviceId;
        }
    });
    
}

function updateCameraList(){
    navigator.mediaDevices.enumerateDevices().then(listDevices);
}

updateCameraList();


let currentStream;
var imageCapture;

function stopVideo(stream){
    stream.getTracks().forEach(track=>{
        track.stop();
    });
}

function startVideo() {
    if (typeof currentStream !== 'undefined'){
        stopVideo(currentStream);
    };
    
    let constraints = {}
    
    if (cameraSelect.value !== ""){
        let videoConstraints = {
            deviceId:{
                exact: cameraSelect.value,
            }
        };
        constraints = {
            video: videoConstraints, 
            audio: false
        };
    }else{
        constraints = {
            video: true, 
            audio: false
        };
    }; 
    
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream=>{
            currentStream = stream;
            video.srcObject = stream; 
            
            const track = stream.getVideoTracks()[0];
            imageCapture = new ImageCapture(track);
        },
        err => console.log(err));        

}

cameraSelect.onchange = startVideo;

startVideo();


let defaultPath = app.getPath("documents");
const directoryBtn = document.getElementById("directoryBtn");

const targetPathContent = document.getElementById("targetPath");
targetPathContent.innerHTML = defaultPath;

let targetPath = targetPathContent.innerHTML;

directoryBtn.onclick = selectDir;
async function selectDir(){
    var dir = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    targetPath = dir.filePaths[0];
    targetPathContent.innerHTML = targetPath;
}


const intervalInput = document.getElementById("interval")
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const timerP = document.getElementById("timer");

var timerId;
var seconds = intervalInput.value * 60;

function UpdateTimerText(seconds){
    timerP.innerHTML = "Next capture in " + seconds + " secs";
}

async function UpdateTime(){
    seconds--;
    if (seconds == 0) {
        Snap();
        TimerReset();
    };
    UpdateTimerText(seconds);
}

function TimerReset(){
    seconds = intervalInput.value * 60 ;
    UpdateTimerText(seconds);
}

function TimerStart() {     
    Snap();   
    clearInterval(timerId);    
    timerId = setInterval(UpdateTime, 1000);
}

function TimerPause(){
    clearInterval(timerId);
    clearInterval(timerId);
    UpdateTimerText(seconds);
}

function Snap(){
    imageCapture.takePhoto().then(function(blob) {
        
        var reader = new FileReader();
        
        var filename = document.getElementById("fileNameRef").value;
        
        var dateNow = new Date(Date.now()).toString();
        var dateFormat = moment(dateNow).format("YYYY-MM-DD_HH-mm-ss")
        
        filename += " - " +  dateFormat + ".jpeg";
        
        var path = node_path.join(targetPath,  filename);
        
        reader.onload = function(){
            var buf = new Buffer(reader.result);
            
            fs.writeFile(path, buf, {}, (err,res) => {
                if(err){
                    console.error(err);
                    return;
                }                
            })
        }
        
        reader.readAsArrayBuffer(blob);
        
        
      });
}

startBtn.onclick = TimerStart;
stopBtn.onclick = TimerPause;
resetBtn.onclick = TimerReset;
intervalInput.onchange = TimerReset;

TimerReset();