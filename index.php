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
<div id="loadingOverlay"><embed id="loadingOverlayGIF" src="https://i.imgur.com/dVi5Ilw.gif"></embed></div>
<h1>Playlistifie</h1>
<div id="changeBGDiv">
    <img src="https://i.imgur.com/hAcGmG3.jpg" id='BG1' class="smolBG"><br>   
    <img src="https://img.wallpapersafari.com/desktop/1440/900/32/54/hn3Wf6.jpeg" id='BG2' class="smolBG"><br>
    <img src="https://i.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.webp" id='BG3' class="smolBG"><br>
</div>
<br>
<button id='login' style='margin: 0%;'>login to spotify</button>
<br>
<button id='current_playback' style='margin-left: 0%;'>show current playback</button>
<br>
<div id='currentPlaybackDiv' class="smol greycardDiv" style="display: none; margin-bottom: 3%;"></div>
<br>
<div>
    <p class="nice-tag">load last.fm data</p>
    <p class="nice-tag" style="background: #bdaaff7a;">OPTIONAL</p>
    <p style="display: inline;">type your last.fm username to get play count data</p>
    <br>
    <div class="input_area">
        <input type="text" id="lastfm_username_input" placeholder="last.fm username"></input>
        <select id="lastfm_period">
            <option value="7day">7 day</option>
            <option value="1month">1 month</option>
            <option value="3month">3 month</option>
            <option value="6month">6 month</option>
            <option value="12month">12 month</option>
            <option value="overakk">overall</option>
        </select>
        <button id='lastfm_gettoptracks'>load last.fm data</button>
    </div>
    <span id="lastfm_loadcomp" class="ldComp" style="display: none">loading complete!</span>
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
<span id="spot_loadcomp" class="ldComp" style="display: none">loading complete!</span>
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

var lastfm_toptracks = [];
var lastfm_tracknameartistcount = {};

$(document).ready(function(){
    $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.15)), url("https://i.imgur.com/hAcGmG3.jpg")');
    $('body').css('background-size',window.innerWidth*1.2+"px");

    $('#login').click(function(){
        login();
    });

    $('#show_all_playlists').click(function(){
        if(playlists.length == 0){ //alreadt executed
            get_all_playlists();
        }
    });

    // $('[id^=BG]').click(function(){
    //     $('body').css('background-image','none');
    //     $('body').css('background-image','url("'+$(this).attr('src')+'")');
    //     // $(this).attr('src');
    // })

    $('#BG1').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.15)), url("https://i.imgur.com/hAcGmG3.jpg")');
        $('body').css('background-size',window.innerWidth*1.2+"px");
    })
    $('#BG2').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url("https://img.wallpapersafari.com/desktop/1440/900/32/54/hn3Wf6.jpeg")');
        $('body').css('background-size','');
    })
    $('#BG3').click(function(){
        $('body').css('background-image','linear-gradient(rgba(0, 0, 0, .3), rgba(0, 0, 0, 0.3)), url("https://i.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.webp")');
        $('body').css('background-size','');
        // $('body').css('background-size',window.innerWidth+' '+window.innerHeight);
    })

    EnterExec('#lastfm_username_input', function(){
        $('#lastfm_gettoptracks').html('loading');
        withLoading(lastfm_fetch);
        // $('#loadingOverlay').show();
        // lastfm_fetch();
        // $('#loadingOverlay').hide();
        $('#lastfm_gettoptracks').html('load last.fm data');
        $('#lastfm_loadcomp').show();
    });

    $('#lastfm_gettoptracks').click(function(){
        $('#lastfm_gettoptracks').css('cursor','wait');
        $('#lastfm_gettoptracks').html('loading');
        withLoading(lastfm_fetch);
        // lastfm_fetch();
        $('#lastfm_gettoptracks').html('load last.fm data');
        $('#lastfm_loadcomp').show();
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
            $('#currentPlaybackDiv').html(currentPlaybackhtml).show();
      });
    });


    EnterExec('#playlist_input', function(){
        $('#get_playlist').html('loading');
        withLoading(get_playlist_details);
        // get_playlist_details();
        $('#get_playlist').html('show playlist detail');
        $('#spot_loadcomp').show();
    });

    // $('#playlist_input').keypress(function(e){
    //     if(e.which == 13){
    //         $('#get_playlist').html('loading');
    //         get_playlist_details();
    //         $('#get_playlist').html('show playlist detail');
    //     }
    // });

    $('#get_playlist').click(function(){
        $('#get_playlist').html('loading');
        withLoading(get_playlist_details);
        // get_playlist_details();
        $('#get_playlist').html('show playlist detail');
        $('#spot_loadcomp').show();
    });
    
    $('#get_liked_song').click(function(){
        $('#get_liked_song').html('loading');
        withLoading(function(){
            get_playlist_details(use_liked_song=true);        
        });
        $('#get_liked_song').html('show liked songs');
        $('#spot_loadcomp').show();
    })


});

</script>
</body>
</html>