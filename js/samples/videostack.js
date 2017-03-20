(function() {

    pi = 3.141593;

    function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    function getRandomSubarray(arr, size) {
        var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(min);
    }

    function loadJSON(filePath) {
      // Load json file;
      var json = loadTextFileAjaxSync(filePath, "application/json");
      // Parse json
      return JSON.parse(json);
    }   
    
    // Load text with Ajax synchronously: takes path to file and optional MIME type
    function loadTextFileAjaxSync(filePath, mimeType)
    {
      var xmlhttp=new XMLHttpRequest();
      xmlhttp.open("GET",filePath,false);
      if (mimeType != null) {
        if (xmlhttp.overrideMimeType) {
          xmlhttp.overrideMimeType(mimeType);
        }
      }
      xmlhttp.send();
      if (xmlhttp.status==200)
      {
        return xmlhttp.responseText;
      }
      else {
        // TODO Throw exception
        return null;
      }
    }

    function loadPaths(data, scene, size, imsize, nF, nP) {
        
        console.log(data);

        data = getRandomSubarray(data, nP);

        nP = data.length;
        console.log(nP);
        console.log(imsize);
        var pts = [];
        var ptsize = 0.2;

        var ptGeometry = new THREE.BufferGeometry();
        var ptPositions = new Float32Array( nP*3 );
        var ptColors = new Float32Array( nP*3 );

        for ( var i = 0; i < nP; i++ ) {

          var pathlength = data[i][0].length;
          var color = new THREE.Color();
          // colors
          var vx = Math.random();
          var vy = Math.random();
          var vz = Math.random();
          color.setRGB( vx, vy, vz );

          var ropeGeometry = new THREE.BufferGeometry();
          //var ropeMaterial = new THREE.LineBasicMaterial( { color: color, linewidth: .1 } );
          var ropeMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
          var ropePositions = [];
          var ropeIndices = [];

          for ( var j = 0; j < pathlength; j++ ) {
            // positions
            var x = data[i][0][j];
            var y = data[i][1][j];
            var z = data[i][2][j];
            //console.log(z);
            var px = 2*size*x/imsize-size;
            var py = -2*size*y/imsize+size;
            var pz = -2*size*z/nF+size;
            ropePositions.push( pz, py, px );

            if (j == 0) {
              ptPositions[3*i] = pz;
              ptPositions[3*i+1] = py;
              ptPositions[3*i+2] = px;
              ptColors[3*i] = vx;
              ptColors[3*i+1] = vy;
              ptColors[3*i+2] = vz;
            }
          }

          for ( var j = 0; j < pathlength-1; j++ ) {
            ropeIndices.push( j, j + 1 );
          }
          ropeGeometry.addAttribute( 'vertexColors', new THREE.BufferAttribute( ptColors, 3 ) );
          ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
          ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
          ropeGeometry.computeBoundingSphere();
          rope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
          scene.add( rope );
        }
        ptGeometry.addAttribute( 'position', new THREE.BufferAttribute( ptPositions, 3 ) );
        ptGeometry.addAttribute( 'color', new THREE.BufferAttribute( ptColors, 3 ) );
        ptGeometry.computeBoundingBox();
        var ptMaterial = new THREE.PointsMaterial( { size: ptsize, vertexColors: THREE.VertexColors } );
        var pts = new THREE.Points( ptGeometry, ptMaterial );
        scene.add(pts);
        return pts;
    }

    function updatePoints(pts, data, size, imsize, frame, nF, nP) {

      var ptPositions = pts.geometry.attributes.position.array;
      for (i = 0; i < nP; i++) {
        var x = data[i][0][frame];
        var y = data[i][1][frame];
        var z = data[i][2][frame];
        var px = 2*size*x/imsize-size;
        var py = -2*size*y/imsize+size;
        var pz = -2*size*z/nF+size;
        ptPositions[3*i] = pz;
        ptPositions[3*i+1] = py;
        ptPositions[3*i+2] = px;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }

    window.samples.videostack = {

    initialize: function(canvas) {
    
        var scene = new THREE.Scene();
        var theta = 0;
        var radius = 13;
        var speed = 0.002;
        var rotate = true;
        var size = 2;
        var vidspeed = 0.03;
        var seg = 0;

        var camera = new THREE.PerspectiveCamera( 30, sample_defaults.width / sample_defaults.height, 1, 1000 );
        camera.position.y = 3;
        camera.position.x = radius*Math.cos(theta);
        camera.position.z = radius*Math.sin(theta);
        camera.lookAt( new THREE.Vector3(0,0,0));

        var texLoader = new THREE.TextureLoader();

        //Generate with image magick's 'montage'
        //montage frame_* -tile 250x1 -geometry 64x64 tile.jpg
        var p = 10;
        var nF = 250;
        var nP = 150;
        var imsize = 1024;
        var nS = nF/p;
        textures = [];
        for ( var i = 0; i < nS; i++ ) {
          var fr = i*p;
          textures[i] = texLoader.load('video/20160412-stk0001/tiled_' + pad(i*p, 4) + '.jpg');
          textures[i].wrapS = THREE.RepeatWrapping;
          textures[i].wrapT = THREE.RepeatWrapping;
          textures[i].repeat.x = 1/p;
        }

        var material1 = new THREE.MeshBasicMaterial( { map: textures[0], opacity: 0.7, side: THREE.DoubleSide } );
        var material2 = new THREE.MeshBasicMaterial( { map: textures[0], opacity: 0.9, side: THREE.DoubleSide } );
        var material3 = new THREE.MeshBasicMaterial( { opacity: 0.7, side: THREE.DoubleSide } );
        material1.transparent = true;
        material2.transparent = true;
        var geometry = new THREE.PlaneGeometry( 2, 2, 2 );
        var sprite1 = new THREE.Mesh( geometry, material1 );
        var sprite2 = new THREE.Mesh( geometry, material2 );
        sprite1.rotation.y = -pi/2;
        sprite1.position.x += 2;
        sprite2.rotation.y = -pi/2;
        sprite2.position.x -= 2;
        sprite1.scale.set( 2, 2, 1 );
        sprite2.scale.set( 2, 2, 1 );
        //scene.add( sprite1 );
        scene.add( sprite2 );

        //Setup texture offset

        //Add cube
        var material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, wireframe: true });
        var scale = 4;
        var geometry = new THREE.CubeGeometry( scale, scale, scale );
        var mesh = new THREE.Mesh( geometry, material );
        var cube = new THREE.BoxHelper(mesh);
        cube.material.color.setRGB( 1, 0, 0 );
        cube.scale.set( 1, 1, 1 );
        scene.add( cube );
        //scene.add( mesh );
    
        var data = loadJSON('paths.json');
        var pts = loadPaths(data, scene, size, imsize, nF, nP)

        var directionalLight = new THREE.DirectionalLight ( 0xffffffff );
        directionalLight.position.set( 0, 3, 7);
        scene.add( directionalLight );
  
        var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
        renderer.setSize( sample_defaults.width, sample_defaults.height );
  
        //Setup mouse inputs 
        var controls = new THREE.OrbitControls( camera, renderer.domElement );
  
        //Setup keyboard controls (toggle rotation)
        var keyboard = new KeyboardState();
  
        var instance = { active: false };
        var tog = true;

        function update()
        {
          keyboard.update();
          if ( keyboard.pressed("A") ) {
            if (tog) {
              if (rotate) {
                rotate = false;
                //sprite1.material = material3;
              }
              else {
                rotate = true;
                sprite1.material = material1;
              }
            }
            tog = false;
          }
          else
            tog = true;
        }
  
        function animate() {
          requestAnimationFrame( animate, canvas );
          if(!instance.active || sample_defaults.paused) return;
  
          //Update theta if the mouse has moved the camera
          theta = Math.atan(camera.position.z/camera.position.x);
          //radius = Math.sqrt(camera.position.z*camera.position.z + cameria.position.x*camera.position.x)
          if (camera.position.x < 0)
            theta += pi;
  
          if (rotate) {
            theta += speed;
            camera.position.x = radius*Math.cos(theta);
            camera.position.z = radius*Math.sin(theta);
            camera.lookAt( new THREE.Vector3(0,0,0));
          }
  
          var time = performance.now() * vidspeed;

          var s1 = Math.floor(nS*( time%250 )/250);
          //texture2.repeat.y = Math.sin( time )/250 + 1/250;
          textures[s1].offset.x = Math.floor( time%10 )/10;

          if (seg != s1) {
            seg = s1;
            sprite2.material.map = textures[s1];
          };

          //texture1.repeat.x = 1/250;
          //texture2.repeat.x = 1/250;
          //texture2.repeat.y = Math.sin( time )/250 + 1/250;
          //texture2.offset.x = Math.floor( time%250 )/250;
          sprite2.position.x = 2 - 4*Math.floor( time%250 )/250;
          //texture2.offset.y = Math.cos( time )/250;

          updatePoints(pts, data, size, imsize, Math.floor(time%250), nF, nP);

          update();
          renderer.render( scene, camera );
        }
  
        animate();
        return instance;
    }
  };
})();
