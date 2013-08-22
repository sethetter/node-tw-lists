var https = require('https');
var OAuth = require('oauth');
var config = require ('./config');
//var user = argv[0];
var user = 'sethetter';
var cursor = "-1";

var consumerKey = config.consumerKey;
var consumerSecret = config.consumerSecret;
var userData = '';

var oauth2 = new OAuth.OAuth2(
  consumerKey,
  consumerSecret,
  'https://api.twitter.com/',
  null,
  'oauth2/token',
  null
);

oauth2.getOAuthAccessToken('',
  {'grant_type':'client_credentials'},
  function(e, accessToken, refreshToken, results) {

    // got bearer token
    var getFriends = function(cursor, callback) {
      var options = {
        host: 'api.twitter.com',
        port: 443,
        path: '/1.1/followers/list.json?cursor='+cursor+'&screen_name='+user+'&skip_status=true&include_user_entities=false',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      };

      https.get(options, function(res) {
        userData = '';
        res.on('data', function(chunk) {
          // grab the user data from the readable stream
          userData += chunk.toString();
        }).on('end', function() {
          userData = JSON.parse(userData);
          if (userData.users) {
            userData.users.forEach(function(user) {
              console.log(user.screen_name);
            });
          }
          // get next cursor and redo request
          if (userData.next_cursor_str) {
            cursor = userData.next_cursor_str;
            callback(cursor);
          }
          // check for error from twitter
          if (userData.errors) {
            userData.errors.forEach(function(error) {
              console.log('API Error: ' + error.message + '; Code: ' + error.code);
              console.log('---------------------------------------------------');
              console.log('Cursor position: ' + cursor);
            });
          }
        });
      }).on('error', function(e) {
        console.log('problem: ' + e.message);
      }).end();
    };

    var loop = function(cursor) {
      getFriends(cursor, function(cursor) {
        if (cursor !== "0") {
          loop(cursor);
        } else {
          return;
        }
      });
    };

    // loop requests until last page
    loop(cursor);
  }
);


