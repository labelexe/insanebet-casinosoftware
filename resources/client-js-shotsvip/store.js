import Vue from 'vue';
import Vuex from 'vuex';

import i18n, { selectedLocale } from './i18n';
import createPersistedState from 'vuex-persistedstate';
import Bus from './bus';

Vue.use(Vuex); 
const telegram = process.env.MIX_APP_TELEGRAM_BOT;

export default new Vuex.Store({
    state: {
        user: null,
        demo: false,
        locale: selectedLocale,
        theme: 'dark',
        unit: 'satoshi',
		usd: false,
        currency: null,
        liveFeedEntries: 15,
        sound: true,
        quick: false,
        chat: true,
        channel: 'casino_' + selectedLocale,
        liveChannel: 'all',
        sidebar: true,
        gameInstance: [],
        games: [],
        currencies: [],
        notifications: [],
        telegram: null,
        recentGameHistory: []
    },
    mutations: {
        setGameInstance(state, gameInstance) {
            state.gameInstance = { ...state.gameInstance, gameInstance };
        },
        setUserData(state, userData) {
            state.user = userData;
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        },
        updateLocale(state, newLocale) {
            state.locale = newLocale;
        },
        updateTelegram(state, bot) {
            state.telegram = bot;
        },
        logout(state) {
            state.user = null;
            axios.defaults.headers.common['Authorization'] = null;
			axios.get('/auth/logout');
        },
        switchTheme(state, status) {
			if(status == true) {
				state.theme = (state.theme === 'dark' ? 'default' : 'dark');
			} else {
				state.theme = state.theme;
			}
            document.querySelector('html').className = 'theme--'+state.theme;
        },
        setCurrencies(state, currencies) {
            state.currencies = currencies;
        },
        setDemo(state, status) {
            state.demo = status;
        },
		setUsd(state, status) {
            state.usd = status;
			if(status == true) {
				state.unit = 'satoshi';
			} else { 
				state.unit = 'btc';
			}
        },
        setUnit(state, unit) {
            state.unit = unit;
        },
        setCurrency(state, unit) {
            state.currency = unit;
        },
        setLiveFeedEntryCount(state, count) {
            state.liveFeedEntries = count;
        },
        setSoundState(state, soundState) {
            state.sound = soundState;
        },
        setQuickState(state, quickState) {
            if(state.gameInstance.playTimeout) return;
            state.quick = quickState;
        },
        toggleChat(state, toggle = null) {
            state.chat = toggle !== null ? toggle : !state.chat;
            Bus.$emit('layoutSizeChange');
        },
        toggleSidebar(state, toggle = null) {
            state.sidebar = toggle !== null ? toggle : !state.sidebar;
            Bus.$emit('layoutSizeChange');
        },
        updateData(state) {
			var payload = {
					category: ['inhouse']
			};
			axios.post('/api/data/games', payload).then(({ data }) => {
				state.games = data = data[0].games;
			});
            axios.post('/api/data/currencies').then(({ data }) => {
                state.currencies = data;
                if(!state.currency || data[state.currency] === undefined) state.currency = data[Object.keys(data)[0]].id;
            });
            axios.post('/api/data/notifications').then(({ data }) => state.notifications = data);
            state.telegram = telegram;
        },
        setChatChannel(state, channel) {
            state.channel = channel;
        },
        setLiveChannel(state, channel) {
            state.liveChannel = channel;
        },
        pushRecentGame(state, id) {
            if(state.recentGameHistory.includes(id)) state.recentGameHistory = state.recentGameHistory.filter((e) => e !== id);
            state.recentGameHistory.push(id);
        }
    },
    actions: {
        login({ commit }, credentials) {
            return axios.get('/sanctum/csrf-cookie').then(() => {
                axios.post('/auth/login', credentials, {
                    withCredentials: true
                }).then(({ data }) => {
                    commit('setUserData', data);
                    commit('updateData');
                    Bus.$emit('login:success');
                }).catch(() => Bus.$emit('login:fail'));
            });
        },
        setUserData({ commit }, data) {
            commit('setUserData', data);
        },
        update({ commit }) {
            if(this.state.user) axios.post('/auth/update').then(({ data }) => {
                if(this.state.user.platformversion != data.platformVersion) {
                    if(this.state.user.platformversion != null) {
                        commit('logout');        
                    }
                }

                commit('setUserData', {
                    user: data,
                    platformversion: process.env.MIX_PLATFORMVERSION,
                    token: this.state.user.token
                });
            });
        },
        logout({ commit }) {
            commit('logout');
        },
        setLiveFeedEntryCount({ commit }, count) {
            commit('setLiveFeedEntryCount', count);
        },
        changeLocale({ commit }, newLocale) {
            i18n.locale = newLocale;
            commit('updateLocale', newLocale);
        },
        switchTheme({ commit }, status = null) {
            commit('switchTheme', status);
        },
        setDemo({ commit }, status) {
            commit('setDemo', status);
        },
		setUsd({ commit }, status) {
            commit('setUsd', status);
        },
        setUnit({ commit }, unit) {
            commit('setUnit', unit);
        },
        setCurrency({ commit }, currency) {
            commit('setCurrency', currency);
        },
        updateData({ commit }) {
            commit('updateData');
        },
        setCurrencies({ commit }, currencies) {
            commit('setCurrencies', currencies);
        },
        setGameInstance({ commit }, gameInstance) {
            commit('setGameInstance', gameInstance);
        },
        setSoundState({ commit }, state) {
            commit('setSoundState', state);
        },
        setQuickState({ commit }, quickState) {
            commit('setQuickState', quickState);
        },
        toggleChat({ commit }, toggle = null) {
            commit('toggleChat', toggle);
        },
        updateTelegram({ commit }, bot) {
            commit('updateTelegram', bot);
        },
        toggleSidebar({ commit }, toggle = null) {
            commit('toggleSidebar', toggle);
        },
        setLiveChannel({ commit }, channel) {
            commit('setLiveChannel', channel);
        },
        setChatChannel({ commit }, channel) {
            commit('setChatChannel', channel);
        },
        pushRecentGame({ commit }, id) {
            commit('pushRecentGame', id);
        }
    },
    plugins: [ createPersistedState() ],
    getters: {
        isGuest: state => !state.user,
        user: state => state.user,
        locale: state => state.locale,
        theme: state => state.theme,
        cdnBase: state=> process.env.MIX_CDNBASE,
        cdnParameters: state=> process.env.MIX_CDNPARAMETERS,
        demo: state => false,
		usd: state => false,
        unit: state => 'satoshi',
        currency: state => state.currency,
        liveFeedEntries: state => state.liveFeedEntries,
        sound: state => state.sound,
        quick: state => state.quick,
        chat: state => state.chat,
        sidebar: state => state.sidebar,
        channel: state => state.channel,
        liveChannel: state => !state.user ? (state.liveChannel === 'mine' ? 'all' : state.liveChannel) : state.liveChannel,
        games: state => state.games,
        currencies: state => state.currencies,
        notifications: state => state.notifications,
        gameInstance: state => state.gameInstance,

        recentGameHistory: state => state.recentGameHistory
    }
});
