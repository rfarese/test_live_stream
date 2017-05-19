videojs.plugin('channelPicker', function(options){
  var _player = this;
  console.log(_player);
  var index = 0;
  var segCounter = 0;
  var pastSeg;

  //debugging
  _player.on(['contentupdate','catalog_response','loadstart','loadedmetadata','loadeddata','canplaythrough'],function(ev){
    console.log(ev.type, _player.tech_.el_.nodeName);
  });

  // .one adds an event listners that runs only 1 time
  // 'loadedmetadata' is triggered when the videos metadata is loaded; specifically the dimensions and duration data
  _player.one('loadedmetadata',function(){
    var param = getParam();
    var playlist = _player.playlist();

    if (param){
        preloadChannel(param, playlist);
    }

    // collects the parameters in the URL
    function getParam(){

       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
       }
       var result = pair[1];
       return result;
    }

    // compares the parameter value with the referenceId of each video in a playlist
    // to determine which video is the current video and positions that video
    // in the proper position in the playlist
    function preloadChannel(param, playlist){
        var index = 0;

        playlist.forEach(function(item){
            if(param == item.referenceId){
                _player.playlist.currentItem(parseInt(index));
            }
            index++;
        });
        return;
    }

  });

  // make sure the ads finished playing
  // 'loadeddata' is fired when the player has downloaded data at the current playback position
  // check to see if the channel is live if conditions are correct
  _player.on('loadeddata',function(){
      console.log(_player.ads.state);
      if (_player.seekable().end(0)!='Infinity' && (_player.ads.state != 'undefined' || _player.ads.state == 'content-playback')){
          checkChannelLive(); //check if channel is live
      }
  });

  // .one adds an event listners that runs only 1 time
  // 'loadstart' is fired when the user agent begins looking for metadata
  _player.one('loadstart', function(){
      var playlist = _player.playlist(),
      channelList = "",
      showOverlay = false,
      selector = document.getElementsByClassName('vjs-menu-content');
      //selector = document.getElementsById('channelSelector');

      // iterate over the playlist and add a <li> element for each one
      playlist.forEach(function(item){

          channelList += "<li class='vjs-menu-title selector-screen' role='menuitemcheckbox' tabindex='-1' value='"+ index +"'>" + item.name + "</li>";

          index++;
      });

      // add an overlay that is displayed with an error
      // and is removed on loadstart 
      _player.overlay({
          overlays: [{
            "start": "error",
            "end": "loadstart",
            "content": "<div class='overlayContainer'><h1>The live event you are trying to watch is either unavailable or has not started</h1><br><div class='vjs-menu'><ul id='channelSelector' class='vjs-menu-content'>"+ channelList +"</ul></div></div>"
          }]
        });

      _player.errors({
        'errors': {
          '4': {
            'headline': 'The Live Event you are trying to watch is either unavailable or has not started',
            'type': 'MEDIA_UNAVAILABLE',
          }
        }
      });

      generateSelector(); //generate the channel picker listing

  });

  // checks to see if the channel is live; in other words, checks to see if the video is streaming...
  function checkChannelLive(){
    console.log('check channel status');

    var endSeg = _player.seekable().end(0);
    var checkCounter = 2; //number of checks

    var timeoutObj = setTimeout(function checkEndSeg() {
      pastSeg = _player.seekable().end(0);
      //double check the 'Infinity' value, in Android Chrome checkChannelLive method is called weirdly.
      if (checkCounter > 0 && _player.seekable().end(0)!='Infinity'){
        console.log(pastSeg + ' = ' + endSeg);
        if (pastSeg != endSeg){
            endSeg = pastSeg; //set the new end segment to the previous end segment
            checkCounter--;
            setTimeout(checkEndSeg, 6000); //6 seconds and check
        } else {
            clearTimeout(timeoutObj); //stop the timer
            checkCounter = 2;
            _player.pause();
            _player.error({code:'-9',type:'Inactive Stream'});
        }
      } else {
          clearTimeout(timeoutObj); //stop the timer
      }
    }, 10000); //10 seconds and check
  }

  function generateSelector(){
      var controlBar,
          newDiv = document.createElement('button'),
          menuDiv = document.createElement('div'),
          newSelect = document.createElement('ul'),
          menuText = document.createElement('span'),
          newTitle = document.createElement('span'),
          playlist = _player.playlist(),
          newOption,
          index = 0;

      //Create new DIV

      newDiv.id = 'selectorDiv';
      newDiv.className = 'vjs-chapters-button vjs-menu-button vjs-menu-button-popup vjs-control vjs-button';
      newDiv.setAttribute('role','button');
      newDiv.setAttribute('type','button');
      newDiv.setAttribute('title','Channel Selector');
      newDiv.setAttribute('tabindex','2');
      newDiv.setAttribute('aria-haspopup','true');
      newDiv.setAttribute('aria-expanded','false');
      newDiv.setAttribute('aria-label','Channel Selector');
      newDiv.setAttribute('aria-live','polite');
      menuDiv.className = 'vjs-menu';
      menuDiv.setAttribute('role','presentation');
      newSelect.id = 'channelSelector';
      newSelect.className = 'vjs-menu-content';
      newSelect.setAttribute('role','menu');
      newTitle.id = 'selectorTitle';
      newTitle.innerHTML = 'Select Court'; //channel selector text
      currentItem = _player.playlist.currentItem();

      var selectorButtons = document.getElementsByClassName('selector-screen');

      newDiv.addEventListener('click',function(){
        if (menuDiv.style.display == "" || menuDiv.style.display == "none"){
            menuDiv.style.display = "inherit";
        } else {
            menuDiv.style.display = "none";
        }
      });

      //loop each of the channels to generate the option list
      playlist.forEach(function(item){
          //console.log(item); //console - can be removed
          //console.log(item.name); //console - can be removed

          //individual channels inside <li>
          var newList = document.createElement('li');
          newList.className = 'vjs-menu-title';
          newList.setAttribute('role','menuitemcheckbox');
          newList.setAttribute('tabindex','-1');

          newList.value = index;
          newList.innerHTML = item.name;
          newSelect.appendChild(newList);
          menuDiv.appendChild(newSelect);
          newDiv.appendChild(newTitle);
          newDiv.appendChild(menuDiv);

          // Get control bar
          controlBar = document.getElementsByClassName('vjs-control-bar')[0];

          // Insert the logo div to the end of the control bar elements
          controlBar.insertBefore(newDiv,controlBar.childNodes[controlBar.childNodes.length-1]);

          newList.addEventListener("click", function(list){
            var channelValue = list.target.value;
            changeChannel(channelValue);
          });

          selectorButtons[index].addEventListener("click", function(list){
            var channelValue = list.target.value;
            changeChannel(channelValue);
          });

          index++;
          //console.log(controlBar);
      });

      menuText.className = 'vjs-control-text';
      menuText.innerHTML = 'Channels';
      newDiv.appendChild(menuText);
  }

  function changeChannel(value){
      var selectorValue,
          thisChannelIndex;

      checkChannelLive();

      console.log('change channel - ',value);

      selectorValue = document.getElementsByClassName('vjs-menu-title');

      _player.playlist.currentItem(parseInt(value)); //picking the channel
      _player.playlist.autoadvance();
      _player.duration(0); //reset duration
      _player.play();
      return;
  }

  _player.on("error", function(err) {
    var showOverlay = false;
    var errCode = _player.error().code;
    var duration = _player.duration();

    //clear error - for playlist in particular
    _player.error(null);

    console.log('error fired - code:', errCode);

    if (((errCode == '2') && (duration =='0')) || (errCode == '4') && (duration == '0') || (errCode == '-9') && (duration == '0')) {
      showOverlay = true;
    }
    if (showOverlay) {

        _player.error(null); // hide error dialog message
        _player.error(null); // show overlay image

      _player.removeClass("hide-overlay");
    } else {
      _player.addClass("hide-overlay"); // hide overlay image
    }
  });
});
