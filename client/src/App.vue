<script setup lang="ts">
import { ref } from 'vue';
import { PROFILE, MESSAGE, PUBLISH, OFFER, CANDIDATE } from '../../server/constants';
import { useWebSocket } from '@vueuse/core';
import { Sprites } from '@pkmn/img';

type User = {
  id: string,
  name: string,
  image?: string
}
const url = process.env.NODE_ENV === "production" ? '/ws' : "ws://127.0.0.1:3000/ws"
const config = {
  'iceServers': [{ 'urls': ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }]
}
const { status, ws, send } = useWebSocket(url)
const profile = ref<User>({
  id: '',
  name: ''
})
const clientMessage = ref("")
const serverMessage = ref("")
const userList = ref<User[]>([])
const pc = ref(new RTCPeerConnection(config));
const dataChannel = ref<RTCDataChannel>(pc.value.createDataChannel('myChannel'))
const channelText = ref("")
const userText = ref("")

dataChannel.value.onmessage = function(e: MessageEvent) {
  channelText.value += `${e.data}\n`
}
pc.value.ondatachannel = function(e) {
  console.log(e.channel)
  dataChannel.value = e.channel
  dataChannel.value.onopen = function(e) {
    console.log('channel open')
  }
  dataChannel.value.onmessage = function (e) {
    console.log(e)
  }
}

if (ws.value) {
  ws.value.onmessage = handleOnMessage
}

function handleOnMessage(e: MessageEvent) {
  const { type, data, id } = JSON.parse(e.data)
  switch (type) {
    case PROFILE:
      profile.value = { ...data, image: getPokeImgUrl(data.name) }
      break;
    case MESSAGE:
      serverMessage.value = data
      break;
    case PUBLISH:
      userList.value = data
      break;
    case OFFER:
      console.log(`Receiver offer from ${id}`)
      handleOffer(data, id)
      break;
    case CANDIDATE:
      console.log(`Receive icecandidate`)
      handleCandidate(data)
      break;
    default:
      break;
  }
}
async function sendOffer(id: string) {
  await pc.value.setLocalDescription()
  send(JSON.stringify({
    type: OFFER,
    data: pc.value.localDescription,
    id
  }))
}
async function handleOffer(offer: RTCSessionDescription, senderId: string) {
  await pc.value.setRemoteDescription(offer)
  if (offer.type === "offer") {
    await pc.value.setLocalDescription();
    send(JSON.stringify({
      type: OFFER,
      data: pc.value.localDescription,
      id: senderId
    }))
  }
  pc.value.onicecandidate = ({ candidate }) => {
    send(JSON.stringify({
      type: CANDIDATE,
      data: candidate,
      id: senderId
    }))
  }
  console.log(pc.value)
}
async function handleCandidate(candidate: RTCIceCandidate) {
  await pc.value.addIceCandidate(candidate)
}
function textChannel(text: string) {
  console.log(text)
  // console.log(dataChannel)
  dataChannel.value.send(text)
}
function getSocketMessage(message: string) {
  return JSON.stringify({
    type: MESSAGE,
    data: message
  })
}
function getPokeImgUrl(name: string) {
  return Sprites.getPokemon(name).url
}
</script>

<template>
  <h1>What does WebSocket actually do?</h1>
  <ol>
    <li>
      <h4>Two-way communicating</h4>
      <ul>
        <li>Status: {{ status }}</li>
        <li>Your profile:
          <ul>Id: {{ profile.id }}</ul>
          <ul>Name<small>(Pokemon name)</small>: {{ profile.name }} <img v-bind:src="profile.image" alt="pkm" /></ul>
        </li>
      </ul>
    </li>
    <li>
      <h4>Send message to server</h4>
      <form @submit.prevent="send(getSocketMessage(clientMessage))">
        <input type="text" v-model="clientMessage"><button type="submit">Send</button>
      </form>
    </li>
    <li>
      <h4>Receive message from the server</h4>
      <p>{{ serverMessage }}</p>
    </li>
    <li>
      <h4>Signal Server for WebRTC</h4>
      <figure>
        <figcaption>User List</figcaption>
        <ul>
          <li v-for="user in userList.filter(u => u.id !== profile.id)">
            {{ user.name }} <img width="30" v-bind:src="getPokeImgUrl(user.name)" alt="pokemon" />
            <button type="button" @click="sendOffer(user.id)">Connect</button>
          </li>
        </ul>
      </figure>
    </li>
  </ol>

  <h1>What does WebRTC actually do?</h1>
  <ol>
    <li>
      <h4>Peer connection</h4>
      <ul>
        <li>ConnectionState: {{ pc.connectionState }}</li>
        <li>SignalingState: {{ pc.signalingState }}</li>
      </ul>
    </li>
    <li>
      <h4>Data Channel <small>State: {{ dataChannel.readyState }}</small></h4> 
      <textarea :value="channelText" cols="100" rows="10" placeholder="Text from channel" disabled></textarea>
      <form @submit.prevent="textChannel(userText)"><input v-model="userText" type="text" placeholder="Your message"><button type="submit">🚀</button></form>
    </li>
  </ol>
</template>
