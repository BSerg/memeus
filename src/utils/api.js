import axios from 'axios';
import cookie from 'js-cookie';

let interceptor = function(config) {
    let jwt = cookie.get('jwt');
    if (jwt) {
        config.headers['Authorization'] = 'Bearer ' + jwt;
    }
    return config;
};

export let api = axios.create({baseURL: '/api/v1'});

api.interceptors.request.use(interceptor);