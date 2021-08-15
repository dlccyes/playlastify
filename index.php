<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" name="viewport" content="width=device-width, initial-scale=1">
    <link rel='stylesheet' href="style.css" type='text/css' media='all' /> 
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="http://code.jquery.com/mobile/1.3.1/jquery.mobile-1.3.1.min.js"></script>
    <script src="config.js"></script>
    <script src="app.js"></script>
    <script src="helpers.js"></script>
    <script src="charts.js"></script>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
    <script src="https://cdn.anychart.com/releases/v8/js/anychart-base.min.js"></script>
    <script src="https://cdn.anychart.com/releases/v8/js/anychart-tag-cloud.min.js"></script>
    <script src="https://cdn.anychart.com/releases/8.10.0/themes/dark_glamour.min.js"></script>
    <script src="https://cdn.anychart.com/releases/8.10.0/themes/dark_turquoise.min.js"></script>
</head>

<body>
<div id="loadingOverlay"><embed id="loadingOverlayGIF" src="https://i.imgur.com/dVi5Ilw.gif"></embed><span id="loadingOverlayText">this may take a while ...</span></div>
<h1>Playlastify</h1>
<h3 style="font-family:Segoe Script;">Dig into your Spotify playlists with last.fm!</h3>
<div id="changeBGDiv">
    <img src="https://i.imgur.com/hAcGmG3.jpg" id='BG1' class="smolBG"><br>   
    <img src="https://img.wallpapersafari.com/desktop/1440/900/32/54/hn3Wf6.jpeg" id='BG2' class="smolBG"><br>
    <img src="https://i.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.webp" id='BG3' class="smolBG"><br>
</div>
<br>
<button id='login' style='margin: 0%;'>login to spotify</button>
<span id="logincomp" class="ldComp" style="display: none">you've logged in!</span>
<br>
<div>
    <p class="nice-tag">load your last.fm data</p>
    <p class="nice-tag" style="background: #bdaaff7a;">OPTIONAL</p>
    <p style="display: inline;">enter your last.fm username to get your scrobbles data</p>
    <br>
    <div class="input_area">
        <input type="text" id="lastfm_username_input" placeholder="last.fm username"></input>
        <select id="lastfm_period">
            <option value="7day">7 day</option>
            <option value="1month">1 month</option>
            <option value="3month">3 month</option>
            <option value="6month">6 month</option>
            <option value="12month">12 month</option>
            <option value="overall">overall</option>
        </select>
        <button id='lastfm_gettoptracks'>load last.fm data</button>
    </div>
    <span id="lastfm_loadcomp" style="display: none"></span>
</div>
<br>
<button id='current_playback' style='margin-left: 0%;'>show current playback</button>
<br>
<div id='currentPlaybackDiv' style="display: none; margin-bottom: 3%; margin-left: 25px;">
    <h3 id="currentTitle"></h3>
    <div id="currentMeta">
        <div id="currentImg"></div>
        <div id="currentAudioFeatureDiv" class="audiofeature"></div>
        <div id="currentAudioFeature2Div" class="audiofeature"></div>
    </div>
</div>
<br>
<!-- <button id='show_all_playlists'>show all playlists</button> -->
<p class="nice-tag">search your spotify playlists</p><br>
<div class="input_area">
    <input type="text" id="playlist_input" placeholder="spotify playlist name"></input>
    <input type="checkbox" id="playlistExactMatch">exact match</input>
    <button id='get_playlist'>show playlist detail</button>
    <br>
    <button id='get_liked_song'>show liked songs</button>
</div>
<span id="spot_loadcomp" class="ldComp" style="display: none"></span><br>
<span id="spot_loadcomp_tip" class="smol" style="display: none"></span>
<br>
<div id='currentPlaylistDiv' style="margin-left: 25px;"></div>
<div id="sauceDiv" class="">
    <a href="https://github.com/dlccyes/playlastify" style="display:flex; text-decoration:none;" target="_blank">
        <!-- <img src="https://logos-world.net/wp-content/uploads/2020/11/GitHub-Emblem.png" width="80px"> -->
        <p style="font-family:Consolas;color: #ffe7e7;">Github</p>
    </a>
</div>

<script>

var token = null;

var scopes = 'user-read-private user-read-email user-library-read user-read-currently-playing\
                user-read-playback-state playlist-read-private';

parse_token(); //get implicit token from url

var lastfm_toptracks = [];
var lastfm_tracknameartistcount = {};
var url;

$(document).ready(function(){
    $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.15)), url("https://i.imgur.com/hAcGmG3.jpg")');
    // $('body').css('background-size',window.innerWidth*1.2+"px");

    $('#login').click(function(){
        get_token_implicit();
        parse_token();
    });

    $('#show_all_playlists').click(function(){ //obsolete
        if(playlists.length == 0){ //alreadt executed
            get_all_playlists();
        }
    });

    $('#BG1').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.15)),\
            url("https://i.imgur.com/hAcGmG3.jpg")');
        $('body').css('background-size','cover');
        // $('body').css('background-size',window.innerWidth*1.2+"px");
    })
    $('#BG2').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url("https://img.wallpapersafari.com/desktop/1440/900/32/54/hn3Wf6.jpeg")');
        $('body').css('background-size','cover');
        // $('body').css('background-size','auto');
    })
    $('#BG3').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, .3), rgba(0, 0, 0, 0.3)), url("https://i.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.webp")');
        $('body').css('background-size','auto');
        // $('body').css('background-size',window.innerWidth+' '+window.innerHeight);
    })

    EnterExec('#lastfm_username_input', function(){
        withLoading(function(){
            lastfm_fetch()
        });
    });

    $('#lastfm_gettoptracks').click(function(){
        withLoading(function(){
            lastfm_fetch()
        });        // lastfm_fetch();
    });

    $('#current_playback').click(function(){
        // current_id='';
        withLoading(function(){
            show_current_playback();
        });
    });

    EnterExec('#playlist_input', function(){
        withLoading(function(){
            get_playlist_details();
        });
    });


    $('#get_playlist').click(function(){
        withLoading(function(){
            get_playlist_details();
        });
    });
    
    $('#get_liked_song').click(function(){
        withLoading(function(){
            get_playlist_details(use_liked_song=true);        
        });
    })

});

</script>
</body>
</html>