//Buttons

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectionBtn = document.getElementById('videoSelectionBtn');

videoSelectionBtn.onclick = getVideoSource; //set 'getVideoSource' mmethod as the event handler when the button is clicked

const { desktopCapturer,remote} = require ('electron'); // get desktopCapturer module forom Electron  https://www.electronjs.org/docs/api/desktop-capturer
const {Menu} = remote; // remote handles IPC (inter-process communication), eletron has a "menu" class but it is designed to run on main process. We need to use IPC since we want to have a pop out menu 


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
                click:() => selectSource()

            };

        })
    );

    videoOptionsMenu.popup(); //open the menu
}


