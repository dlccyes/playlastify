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

<button id='login' style='margin: 0%;'>login to spotify</button>
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
<button id='get_liked_song'>show liked songs</button>
<br>
<div id='currentPlaylistDiv'></div>


<script>

var token = null;

var scopes = 'user-read-private user-read-email user-library-read user-read-currently-playing\
                user-read-playback-state playlist-read-private';

var url = String(window.location);
if(url.search(/=/)!=-1){
    var code = url.slice(url.search(/=/)+1,);
}
if(code){
    token = get_token();
}
// var playlists = [];

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
            console.log(xhr['item']['name'],'by', xhr['item']['artists'][0]['name']);
            temp = '';
            for(var artist of xhr['item']['artists']){
                temp += artist['name'] + ', ';
            }
            temp = temp.slice(0,-2);
            currentPlaybackhtml = xhr['item']['name']+' - '+temp;
            $('#currentPlaybackDiv').html(currentPlaybackhtml);
      });
    });

    $('#playlist_input').keypress(function(e){
        if(e.which == 13){
            $('#get_playlist').html('loading');
            get_playlist_details();
            $('#get_playlist').html('show playlist detail');
        }
    });

    $('#get_playlist').click(function(){
        $('#get_playlist').html('loading');
        get_playlist_details();
        $('#get_playlist').html('show playlist detail');
    });
    
    $('#get_liked_song').click(function(){
        $('#get_liked_song').html('loading');
        get_playlist_details(use_liked_song=true);        
        $('#get_liked_song').html('show liked songs');
    })


});

</script>
</body>
</html>