<template>
    <v-layout row wrap justify-center>
      <v-flex xs12 lg10 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
        <v-layout row wrap justify-center>
          <v-flex xs12 md8 lg4 xl6>
            <img style="width:100%" v-bind:src="logo" />
          </v-flex>
        </v-layout>
        <v-stepper
          style="background: rgba(0,0,0,0.3); border-radius: 20px"
          v-model="e1"
          dark
          class="ma-4"
        >
          <v-stepper-header>
            <v-stepper-step step="1" :complete="true">Select a client</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="2" :complete="false">Join a room</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="3">Sync</v-stepper-step>
          </v-stepper-header>
        </v-stepper>
        <v-layout row wrap justify-center>
          <v-flex xs12 class="ml-4">
            <h2 class="text-xs-left">Connect to a SyncLounge room</h2>
          </v-flex>
            <v-flex xs12 class="ml-4">
              <p>It's time to connect to SyncLounge. From the list select a server which is closest to your location. Once you've chosen one that works for you it's time to create a room for your friends to join. If the room does not exist it will be created for you.</p>
            </v-flex>
          <v-flex
            xs12
            class="nicelist pa-4"
            v-if="!context.getters.getConnected && recents && Object.keys(recents).length > 0"
            style="color:white !important;"
          >
            <v-subheader>Recent Rooms</v-subheader>
            <v-list class="pa-0">
              <template v-for="(item, index) in recentsSorted">
                <v-list-tile :key="index" v-if="index < 5" avatar @click="recentConnect(item)">
                  <v-list-tile-avatar>
                    <img :src="logos.light.small" style="width: 32px; height: auto" />
                  </v-list-tile-avatar>
                  <v-list-tile-content>
                    <v-list-tile-title>{{ item.name || item.server || 'Custom' }}</v-list-tile-title>
                    <v-list-tile-sub-title>
                      <b>{{ item.room }}</b>
                      <span style="opacity: 0.5; float: right">{{ sinceNow(item.time) }}</span>
                    </v-list-tile-sub-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <v-tooltip top color="light-blue darken-4">
                      <v-icon
                        color="white"
                        dark
                        slot="activator"
                        @click.stop="removeHistoryItem(item)"
                      >close</v-icon>Remove
                    </v-tooltip>
                  </v-list-tile-action>
                </v-list-tile>
              </template>
            </v-list>
          </v-flex>
          <v-flex
            xs12
            class="nicelist pa-4"
            v-if="!context.getters.getConnected"
            style="color:white !important"
          >
            <v-subheader>Select a server</v-subheader>
            <v-layout row wrap justify-center align-center>
              <v-flex
                pa-2
                xs12
                md3
                lg2
                v-for="server in ptservers"
                :key="server.url"
              >
                <v-card height="300px" style="border-radius: 20px">
                  <v-layout row wrap justify-start align-center style="height: 100%">
                    <v-flex xs12 class="text-xs-center pa-2" style="height: 80px">
                      <img
                        :src="server.image"
                        style="max-height: 100%; vertical-align: middle; max-width: 80%; border-radius: 7px"
                      />
                    </v-flex>
                    <v-flex xs12 class="text-xs-center">
                      <h2>{{ server.name }}</h2>
                      <h4>{{ server.location }}</h4>
                    </v-flex>
                    <v-flex xs12 class="text-xs-center" v-if="server.url !== 'custom'">
                      <div v-if="results[server.url]">
                        <div v-if="results[server.url].alive">
                          Ping:
                          <span
                            class="thick--text"
                            :class="connectionQualityClass(results[server.url].latency)"
                          >{{ results[server.url].latency }}ms</span>
                        </div>
                        <div v-else class="text-xs-center red--text">error</div>
                        </div>
                    </v-flex>
                    <v-flex xs12 class="text-xs-center">
                      <div v-if="server.url !== 'custom'">
                        <div v-if="results[server.url]">
                          <div v-if="results[server.url].alive">
                            <div>
                              Load:
                              <span
                                class="thick--text"
                                :class="loadQualityClass(results[server.url].result)"
                              >{{ results[server.url].result || 'Unknown' }}</span>
                            </div>
                          </div>
                          <div v-else class="text-xs-center red--text">error</div>
                        </div>
                      </div>
                    </v-flex>

                    <v-flex xs12 class="text-xs-center pt-1 mt-4">
                      <v-btn
                        color="primary"
                        :disabled="connectionPending"
                        @click="serverSelected(server)"
                        style="width: 80%; border-radius: 7px; margin: auto; position: absolute; bottom: 5px; left: 0; right: 0;"
                      >Connect</v-btn>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
            <v-text-field
              v-if="selectedServer.url == 'custom'"
              name="input-2"
              label="Custom Server"
              v-model="CUSTOMSERVER"
              class="input-group pt-input"
            ></v-text-field>
            <v-layout row wrap v-if="selectedServer.url == 'custom'">
              <v-flex xs12>
                <v-btn
                  class="pt-orange white--text pa-0 ma-0"
                  color="primary"
                  primary
                  style="width:100%"
                  v-on:click.native="attemptConnectCustom()"
                >Connect</v-btn>
              </v-flex>
            </v-layout>
            <v-layout row wrap v-if="connectionPending && !serverError" class="pt-3">
              <v-flex xs12>
                <div style="width:100%;text-align:center">
                  <v-progress-circular
                    indeterminate
                    v-bind:size="50"
                    class="amber--text"
                    style="display:inline-block"
                  ></v-progress-circular>
                </div>
              </v-flex>
            </v-layout>
            <v-layout class="pt-3 text-xs-center" row wrap v-if="serverError">
              <v-flex xs12 class="red--text">
                <v-icon class="red--text">info</v-icon>
                {{ serverError }}
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex xs12 v-if="context.getters.getConnected" class="text-xs-center">
            <v-layout row wrap>
              <v-flex xs12 md6 offset-md3>
                <v-text-field
                  origin="center center"
                  :maxlength="25"
                  name="input-2"
                  label="Room name"
                  :autofocus="true"
                  v-on:keyup.enter.native="joinRoom()"
                  v-model="room"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 md6 offset-md3>
                <v-text-field
                  transition="v-scale-transition"
                  origin="center center"
                  name="input-2"
                  label="Room password"
                  v-on:keyup.enter.native="joinRoom()"
                  v-model="password"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 md6 offset-md3>
                <v-btn block color="primary" v-on:click.native="joinRoom()">Join</v-btn>
              </v-flex>
              <v-layout class="pt-3 text-xs-center" row wrap v-if="roomError">
                <v-flex xs12 class="red--text">
                  <v-icon class="red--text">info</v-icon>
                  {{ roomError }}
                </v-flex>
              </v-layout>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
</template>

<script>
import Vue from 'vue';

const axios = require('axios');

export default {
  props: ['object'],
  name: 'joinroom',
  data() {
    return {
      selectedServer: '',
      serverError: null,
      roomError: null,
      room: '',
      e1: 2,
      password: '',
      connectionPending: false,
      thisServer: window.location.origin,
      recents: null,

      results: {},

      destroyed: false,
    };
  },
  mounted() {
    setTimeout(() => {
      this.testConnections();
      const ticker = setInterval(() => {
        if (this.destroyed) {
          return clearInterval(ticker);
        }
        this.testConnections();
      }, 5000);
    }, 1500);
  },
  beforeDestroy() {
    this.destroyed = true;
  },
  created() {
    if (this.slRoom && this.slConnected && this.slServer) {
      this.$router.push('/browse');
    }
    this.getRecents();
  },
  methods: {
    getRecents() {
      this.recents = JSON.parse(window.localStorage.getItem('recentrooms'));
    },
    removeHistoryItem(item) {
      const recents = JSON.parse(window.localStorage.getItem('recentrooms'));
      delete recents[`${item.server}/${item.room}`];
      window.localStorage.setItem('recentrooms', JSON.stringify(recents));
      return this.getRecents();
    },
    connectionQualityClass(value) {
      if (value < 50) {
        return ['green--text', 'text--lighten-1'];
      }
      if (value < 150) {
        return ['lime--text'];
      }
      if (value < 250) {
        return ['orange--text'];
      }
      return ['red--text'];
    },
    loadQualityClass(value) {
      if (value === 'low') {
        return ['green--text', 'text--lighten-1'];
      }
      if (value === 'medium') {
        return ['orange--text'];
      }
      if (value === 'high') {
        return ['red--text'];
      }
      return ['white--text'];
    },
    serverSelected(server) {
      this.selectedServer = server;
      if (this.selectedServer.defaultRoom) {
        this.room = this.selectedServer.defaultRoom;

        if (this.selectedServer.defaultPassword) {
          this.password = this.selectedServer.defaultPassword;
        }
      }
      if (this.selectedServer.url !== 'custom') {
        this.attemptConnect();
      }
    },
    async testConnections() {
      this.ptservers.map((server) => {
        if (server.url !== 'custom') {
          const start = new Date().getTime();
          axios
            .get(`${server.url}/health`)
            .then((res) => {
              Vue.set(this.results, server.url, {
                alive: true,
                latency: Math.abs(start - new Date().getTime()),
                result: res.data.load || null,
              });
            })
            .catch((e) => {
              Vue.set(this.results, server.url, {
                alive: false,
                latency: Math.abs(start - new Date().getTime()),
                result: null,
              });
            });
        }
      });
    },
    attemptConnect() {
      // Attempt the connection
      return new Promise((resolve, reject) => {
        this.serverError = null;
        if (this.selectedServer.url !== 'custom') {
          this.connectionPending = true;
          this.$store
            .dispatch('socketConnect', { address: this.selectedServer.url })
            .then((result) => {
              this.connectionPending = false;
              if (result) {
                if (this.room) {
                  this.joinRoom()
                    .then(() => {})
                    .catch((e) => {});
                }
                resolve();
              } else {
                this.serverError = null;
                reject(result);
              }
            })
            .catch((e) => {
              this.connectionPending = false;
              this.serverError = `Failed to connect to ${this.selectedServer.url}`;
              reject(e);
            });
        } else {
          reject(new Error('Custom error: wrong function'));
        }
      });
    },
    attemptConnectCustom() {
      this.connectionPending = true;
      this.serverError = null;
      this.$store
        .dispatch('socketConnect', { address: this.CUSTOMSERVER })
        .then((result) => {
          this.connectionPending = false;
          if (result) {
            this.serverError = `Failed to connect to ${this.CUSTOMSERVER}`;
          } else {
            this.serverError = null;
          }
        })
        .catch(() => {
          this.connectionPending = false;
          this.serverError = `Failed to connect to ${this.CUSTOMSERVER}`;
        });
    },
    async recentConnect(recent) {
      console.log('Attempting to connect to', recent);
      this.selectedServer = {
        url: recent.server,
      };
      this.room = recent.room;
      this.password = recent.password;
      await this.attemptConnect();
    },
    async joinRoom() {
      if (!this.context.getters.getConnected) {
        throw new Error('not connected to a server');
      }
      if (this.room === '' || this.room == null) {
        this.roomError = 'You must enter a room name!';
        throw new Error('no room specified');
      }
      try {
        await this.$store.dispatch('joinRoom', {
          user: this.plex.user,
          roomName: this.room,
          password: this.password,
        });
      } catch (e) {
        this.roomError = e;
        throw e;
      }
    },
  },
  watch: {
    selectedServer() {
      // this.attemptConnect()
      this.serverError = null;
    },
    slRoom() {
      if (this.slServer && this.slRoom) {
        this.$router.push('/browse');
      }
    },
  },
  computed: {
    plex() {
      return this.$store.state.plex;
    },
    logo() {
      return this.logos.light.long;
    },
    context() {
      return this.$store;
    },
    recentsSorted() {
      if (!this.recents) {
        return [];
      }
      let arr = [];
      for (const i in this.recents) {
        const item = this.recents[i];
        arr.push(item);
      }
      arr = arr.sort((a, b) => b.time - a.time);
      if (arr.length > 3) {
        return arr.slice(0, 3);
      }
      return arr;
    },
    CUSTOMSERVER: {
      get() {
        if (!this.$store.getters.getSettings.CUSTOMSERVER) {
          return 'http://';
        }
        return this.$store.getters.getSettings.CUSTOMSERVER;
      },
      set(value) {
        this.$store.commit('setSetting', ['CUSTOMSERVER', value]);
      },
    },
    ptservers() {
      if (typeof this.$store.getters.getSettings.SERVERS === 'string') {
        return JSON.parse(this.$store.getters.getSettings.SERVERS);
      }
      return this.$store.getters.getSettings.SERVERS;
    },
  },
};
</script>
<style>

</style>
