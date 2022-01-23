let createRoomBtm = document.querySelector(".room-create-btm"),
    roomJoinBtm = document.querySelector(".room-join-form-btm"),
    joinRoomBox = document.querySelector(".join-room"),
    creatRoomBox = document.querySelector(".creat-room"),
    passStatus = document.querySelector(".passStatus"),
    passInput = document.querySelector(".passInputCreat");

    passEnable();
    passStatus.onclick = passEnable;
    roomJoinBtm.onclick = showRoomJoin;
    createRoomBtm.onclick = showCreatRoom;
    
    
function passEnable(){
    if(passStatus.checked == true){
        passInput.style.background = "lightslategray";
        passInput.disabled = "disabled";

    }
    if(passStatus.checked == false){
        passInput.style.background = "white"; 
        passInput.disabled = false; 
    }
}

function showRoomJoin(){
    joinRoomBox.style.display = "block";
    creatRoomBox.style.display = "none";
    roomJoinBtm.style.transform = "scale(1.25)";
    createRoomBtm.style.transform = "scale(1)";
    roomJoinBtm.style.borderColor = "#008C8C";
    createRoomBtm.style.borderColor = "transparent";
    
}
function showCreatRoom(){
    joinRoomBox.style.display = "none";
    creatRoomBox.style.display = "block";
    createRoomBtm.style.transform = "scale(1.25)";
    createRoomBtm.style.borderColor = "#008C8C";
    roomJoinBtm.style.transform = "scale(1)";
    roomJoinBtm.style.borderColor = "transparent";
}



let mapPeers = {};

let localStream = new MediaStream();

let usernameInput = document.querySelector('#username');
let btnJoin = document.querySelector('#btn-join');

let btnSendMsg = document.querySelector('#btn-send-msg');
let messageList = document.querySelector('#message-list');
let messageInput = document.querySelector('#msg');

let username;
let webSocket;

function webSoketOnMessage(event) {
    let parsedData = JSON.parse(event.data);

    let peerUsername = parsedData['peer'];
    let action = parsedData['action'];

    if (username == peerUsername) {
        return;
    }

    let receiver_channel_name = parsedData['message']['receiver_channel_name'];

    if (action == 'new-peer') {
        createOffer(peerUsername, receiver_channel_name);

        return;
    }

    if (action == 'new-offer') {
        let offer = parsedData['message']['sdp'];

        createAnswerer(offer, peerUsername, receiver_channel_name);

        return;
    }

    if (action == 'new-answer') {
        let answer = parsedData['message']['sdp'];

        let peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);

        return;
    }
}

btnJoin.addEventListener('click', () => {
    username = usernameInput.value;


    if (username == '') {
        return;
    }
    usernameInput.value = username;

    let labelUsername = document.querySelector('#label-username');
    labelUsername.innerHTML = username;

    let loc = window.location;
    let wsStart = 'ws://';

    if (loc.protocol == 'https:') {
        wsStart = 'wss://'
    }

    let endPoint = wsStart + loc.host + loc.pathname;

    console.log('Endpoint: ', endPoint);

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log('Connection open');

        sendSignal('new-peer', {});

    });

    webSocket.addEventListener('message', webSoketOnMessage);

    webSocket.addEventListener('close', (e) => {
        console.log('Connection close');
    });

    webSocket.addEventListener('error', (e) => {
        console.log('Error occured');
    });

});



const constraints = {
    'video': true,
    'audio': true
};

const localVideo = document.querySelector('#local-video');

const btnToggleAudio = document.querySelector('#btn-toggle-audio');
const btnToggleVideo = document.querySelector('#btn-toggle-video');

let userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        let audioTracks = stream.getAudioTracks();
        let videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;

        btnToggleAudio.addEventListener('click', () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;

            if (audioTracks[0].enabled) {
                btnToggleAudio.innerHTML = 'Audio Mute';

                return;
            }

            btnToggleAudio.innerHTML = 'Audio Unmute';
        });

        btnToggleVideo.addEventListener('click', () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;

            if (videoTracks[0].enabled) {
                btnToggleVideo.innerHTML = 'Video off';

                return;
            }

            btnToggleVideo.innerHTML = 'Video on';
        });

    })
    .catch(error => {
        console.log("Error accessing media devices.");
    });



function sendSignal(action, message) {
    let jsonStr = JSON.stringify({
        'peer': username,
        'action': action,
        'message': message,
    });

    webSocket.send(jsonStr);
}

function createOffer(peerUsername, receiver_channel_name) {
    let peer = new RTCPeerConnection(null);

    addLocalTrack(peer);

    let dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => {
        console.log('Connecting opened!');
    });
    dc.addEventListener('message', dcOnMessage);

    let remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        let iceConnectionState = peer.iceConnectionState;

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername];
            if (iceConnectionState != 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ice candidate:', JSON.stringify(peer.localDescription));

            return;
        }
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local description set successfully.');
        });

}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
    let peer = new RTCPeerConnection(null);

    addLocalTrack(peer);

    let remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => {
            console.log('Connecting opened!');
        });
        peer.dc.addEventListener('message', dcOnMessage);

        mapPeers[peerUsername] = [peer, peer.dc];
    });

    peer.addEventListener('iceconnectionstatechange', () => {
        let iceConnectionState = peer.iceConnectionState;

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername];
            if (iceConnectionState != 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ice candidate:', JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Remote description set successfully for %s.', peerUsername);

            return peer.createAnswer();
        })
        .then(a => {
            console.log('Answer created!');

            peer.setLocalDescription(a);
        });
}

function addLocalTrack(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    return;
}


function dcOnMessage(event) {
    let message = event.data;

    let li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);

}

function createVideo(peerUsername) {
    let videoContainer = document.querySelector('#video-container');

    let remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    let videoWrapper = document.createElement('div');
    let userBox = document.createElement('div');

    
    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(userBox);
    userBox.appendChild(remoteVideo);

    videoWrapper.classList = "user ";
    userBox.classList = "user-video";

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    let remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    });
}

function removeVideo(video) {
    let videoWrapper = video.parentNode();

    videoWrapper.parentNode.removeChild(videoWrapper);
}

btnSendMsg.addEventListener('click', sendMsgOnClick);

function sendMsgOnClick(){
    let message = messageInput.value;

    if (message == '' || message == ' '){
        return;
    }

    let li = document.createElement('li');
    li.appendChild(document.createTextNode('Me: ' + message));
    messageList.append(li);

    let dataChannels = getDataChannels();

    message = username + ': ' + message;

    for(index in getDataChannels){
        dataChannels[index].send(message);
    }

    messageInput.value = '';
}

function getDataChannels(){
    let dataChannels = [];

    for(peerUsername in mapPeers){
        let dataChannel = mapPeers[peerUsername][1];

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}