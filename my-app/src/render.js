//Buttons

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectionBtn = document.getElementById('videoSelectionBtn');


const { desktopCapturer,remote} = require ('electron'); // get desktopCapturer module forom Electron  https://www.electronjs.org/docs/api/desktop-capturer

//In Electron, GUI-related modules (such as dialog, menu etc.) are only available in the main process, not in the renderer process. In order to use them from the renderer process, the ipc module is necessary to send inter-process messages to the main process.  
const {Menu} = remote; // remote handles IPC (inter-process communication), eletron has a "menu" class but it is designed to run on main process. We need to use IPC since we want to have a pop out menu 






videoSelectionBtn.onclick = getVideoSource; //set 'getVideoSource' mmethod as the event handler when the button is clicked

/**
 *  Async functions enable us to write promise based code as if it were synchronous, but without blocking the execution thread.
 */


//get available video sources, event handler used when Btn click, its a synchronous class 
async function getVideoSource(){

    //desktopCapturer.getVideoSource() method returns a promise, its a array of DesktopCapturerSource objects, each DesktopCapturer Source represents a screen or an individual window that can be captured
    const inputSources = await desktopCapturer.getSources({ //use await keyword to wait for the actual return value 
        types:['window','screen'] //getVideoSource take a object as input , types String[] - An array of Strings that lists the types of desktop sources to be captured, available types are screen and window.
    });

    //set a variable for menu of itself (pop up menu for selecting a capture resource)
    const videoOptionsMenu = Menu.buildFromTemplate(
        
        //use js remap method to convert "inputSource" array into a array of menu items
        inputSources.map(source =>{ 
            
            //return a object which contains source name and a button which call the 'selectSource' method
            return{
                label:source.name,
                click:() => selectSource(source)

            };

        })
    );

    videoOptionsMenu.popup(); //open the menu
}

//global media recorder
let mediaRecorder; 
const recordedChunks = []; //can record in serval chunks


//change the videoSource window to record
async function selectSource(source){

    videoSelectionBtn.innerText = source.name;

    const constraints = {
        audio:false,
        video:{
            mandatory: {
                chromeMediaSource:'desktop',
                chromeMediaSourceId:source.id
            }
        }
    };

    
    //create a stream video,using browser build in nagivation API to create a stream video
    //this will record a stream whatever happend in that window
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    //preview the source in a video element(HTML element)
    videoElement.srcObject = stream;
    videoElement.play();

    //create the media recorder
    const options = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream,options);

    //Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable; 
    mediaRecorder.onstop = handleStop;
}




startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};
  
  
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};



//Captrues all recorded chunks when the source is avabile
function  handleDataAvailable(e){ //e stands for event which will be used for ondataavailable
    recordedChunks.push(e.data);
}

//electron freature dialog which runs in the main process, we can access it by using remote we create perviously
const {dialog} = remote;

//write the file to the system
const { writeFile} = require('fs');



//Save the video file on stop
async function handleStop(e){ ////e stands for event which will be used for onstop

    //a data sturcture which can handle raw data
    const blob = new Blob(recordedChunks,{
        type: 'video/webm; codecs=vp9'
    });

    //using buffer to handle blob(raw data)
    const  buffer = Buffer.from(await blob.arrayBuffer());

    //we can dialog to open and save file easier
    const {filePath} = await dialog.showSaveDialog({

        //customize the button to save video
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`

    });  //showSaveDialog will reslove to path that user uses


    console.log(filePath);

    writeFile(filePath,buffer,()=>console.log('video saved successfully'));
}