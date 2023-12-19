import { Api } from '../services/Api';

export function createApi() {
    const apiConnection = JSON.parse(localStorage.getItem('ts-api-connection'));
    if (!apiConnection || !apiConnection.url || !apiConnection.org || !apiConnection.token) {
        console.warn("No valid api connection:\nlocalStorage.setItem('ts-api-connection', JSON.stringify({\n\turl: 'https://...',\n\torg: 'name',\n\ttoken: 'secret',\n}));");
        return null;
    }

    return new Api(apiConnection);
}