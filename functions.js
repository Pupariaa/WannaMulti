const dotenv = require('dotenv');
const axios = require('axios');
const { clients } = require('./models/Events');
const envFile = '../config.env';
dotenv.config({ path: envFile });

async function checkUserOnline() {
  try {
    const user = await clients.findOne({ where: { client_id: process.env.client_id }, attributes: ['osu_token'] });
    if (!user) return null;

    const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${process.env.osu_userid}`, {
      headers: { Authorization: `Bearer ${user.osu_token}` }
    });
    return response.data && response.data.is_online;
  } catch (error) {
    console.error('Error fetching Osu Token:', error);
    return null;
  }
}
async function UsernameExists(username) {
  try {
    const response = await axios.get(`https://osu.ppy.sh/api/get_user?k=${process.env.osu_apikey}&u=${username}`);
    return response.data.length > 0;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

module.exports = {
 checkUserOnline, UsernameExists
};
