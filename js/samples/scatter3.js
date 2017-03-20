(function() {

    pi = 3.141593;

    // Load JSON text from server hosted file and return JSON parsed object
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

    function loadPts(path, scene, size, xlim, ylim, zlim) {
        var data = loadJSON('test.json');
        console.log(data);
        var particles = data.length;
        var geom = new THREE.BufferGeometry();
        var positions = new Float32Array( particles * 3 );
        var colors = new Float32Array( particles * 3 );
        var color = new THREE.Color();
        var n = size, n2 = n / 2; // particles spread in the cube
        for ( var i = 0; i < positions.length; i += 3 ) {
          // positions
          var x = data[i/3][0];
          var y = data[i/3][1];
          var z = data[i/3][2];
          positions[ i ]     = 2*size*(x-xlim[0])/(xlim[1] - xlim[0])-size;
          positions[ i + 1 ] = 2*size*(y-ylim[0])/(ylim[1] - ylim[0])-size;
          positions[ i + 2 ] = -2*size*(z-zlim[0])/(zlim[1] - zlim[0])+size;
          // colors
          var vx = ( x / n ) + 0.5;
          var vy = ( y / n ) + 0.5;
          var vz = ( z / n ) + 0.5;
          color.setRGB( vx, vy, vz );
          colors[ i ]     = color.r;
          colors[ i + 1 ] = color.g;
          colors[ i + 2 ] = color.b;
        }
        //geom.attributes['position'] = new THREE.BufferAttribute( positions, 3 ) ;
        //geom.attributes['color'] = new THREE.BufferAttribute( colors, 3 );
        geom.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geom.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        geom.computeBoundingSphere();
        //
        var mat = new THREE.PointsMaterial( { size: 0.2, vertexColors: THREE.VertexColors } );
        points = new THREE.Points( geom, mat );
        scene.add( points );
        //Draw axes
        var divisions = 5;
        var gridHelperX = new THREE.GridHelper( size, divisions );
        var gridHelperY = new THREE.GridHelper( size, divisions );
        var gridHelperZ = new THREE.GridHelper( size, divisions );
        gridHelperX.rotation.x = -pi/2;
        gridHelperX.position.z += 2;
        gridHelperY.rotation.z = -pi/2;
        gridHelperY.position.x -= 2;
        gridHelperZ.position.y -= 2;
        scene.add( gridHelperX );
        scene.add( gridHelperY );
        scene.add( gridHelperZ );
    }

    window.samples.scatter3 = {

    initialize: function(canvas) {
    
        var scene = new THREE.Scene();
        var theta = 0;
        var radius = 13;
        var speed = 0.002;
        var rotate = false;
        var size = 2;

        var camera = new THREE.PerspectiveCamera( 30, sample_defaults.width / sample_defaults.height, 1, 1000 );
        camera.position.y = 3;
        camera.position.x = radius*Math.cos(theta);
        camera.position.z = radius*Math.sin(theta);
        camera.lookAt( new THREE.Vector3(0,0,0));

        var texture = THREE.ImageUtils.loadTexture(
              'images/checker_large.gif',
              {},
              function() {
                animate();
              }
        );
  
        //Create points based on data
        //Load in data in synchronous fashion
        //This gives a warning about loading synchronously... will have to find
        //another solution eventually
        path = 'test.json';
        xlim = [0, 15];
        ylim = [0, 15];
        zlim = [0, 15];
        loadPts(path, scene, size, xlim, ylim, zlim)

        //Add cube
        //var material = new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.8 });
        //var scale = 2.5;
        //var geometry = new THREE.CubeGeometry( scale, scale, scale );
        //var mesh = new THREE.Mesh( geometry, material );
        //scene.add( mesh );
    
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
              if (rotate)
                rotate = false;
              else
                rotate = true;
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
          if (camera.position.x < 0)
            theta += pi;
  
          if (rotate) {
            theta += speed;
            camera.position.x = radius*Math.cos(theta);
            camera.position.z = radius*Math.sin(theta);
            camera.lookAt( new THREE.Vector3(0,0,0));
          }
  
          update();
          renderer.render( scene, camera );
        }
  
        animate();
        return instance;

    }
  };
})();
