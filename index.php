<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link rel='stylesheet' href="style.css" type='text/css' media='all' /> 
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="config.js"></script>
    <script src="app.js"></script>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</head>

<body>

<button id='login'>login to spotify</button>
<button id='current_playback'>show current playback</button>
<br>
<!-- <button id='show_all_playlists'>show all playlists</button> -->
<br>
<div id='currentPlaybackDiv'></div>
<br>
<p>search playlist</p>
<input type="text" id="playlist_input"></input>
<input type="checkbox" id="playlistExactMatch">exact match</input>
<button id='get_playlist'>show playlist detail</button>
<br>
<div id='currentPlaylistDiv'></div>


<script>

var token = null;

var scopes = 'user-read-private user-read-email';

var url = String(window.location);
if(url.search(/=/)!=-1){
    var code = url.slice(url.search(/=/)+1,);
}
if(code){
    token = get_token();
}
var playlists = [];

$(document).ready(function(){
    $('#login').click(function(){
        login();
    });

    $('#show_all_playlists').click(function(){
        if(playlists.length == 0){ //alreadt executed
            get_all_playlists();
        }
    });

    $('#current_playback').click(function(){
        play = spott_get('https://api.spotify.com/v1/me/player', token, function(xhr){
            console.log(xhr['item']['name'],'by',xhr['item']['artists'][0]['name']);
            currentPlaybackhtml = xhr['item']['name']+' by '+xhr['item']['artists'][0]['name'];
            $('#currentPlaybackDiv').html(currentPlaybackhtml);
      });
    });

    $('#playlist_input').keypress(function(e){
        if(e.which == 13){
            get_playlist_details();
        }
    })

    $('#get_playlist').click(function(){ //get full playlist details including all tacks
        get_playlist_details();
    });
    


});

</script>
</body>
</html>