(function() {

  function randomArray(length, max) {
      return Array.apply(null, Array(length)).map(function() {
          return (Math.random() * max);
      });
  }

  function initLIF() {
    var params = {
      'rc' : 8, // in [ms]
      'ir' : 20, 
      'theta' :16, // in [mV]
      'q' : 0.8, // reliability
      'A' : 1.0, // spike height [mV]
      'nn' : 13, // number of neurons
      'syn' : randomArray(169, -1),
      'rec' : [false, false, true, false, true, false, true, false, true, false, true, false, false]
    };

    //for i=1:nn, syn(i,i) = 0; end

    for(count = 0; count < params.nn; count++){
      params.syn[count*params.nn+count] = 0;
    }

    var v = randomArray(params.nn, params.theta);
    var times = v.map(i => params.rc * Math.log( (i-params.ir) / (params.theta-params.ir) ));
    return [params, v, times];

  }

  function LIF(tf, v, times, params, time, spktms) {

    while (time< tf) {
      //Determine shortest of all waiting times
      var tmin = 1e6;
      var imin = 0;
      for (idx = 0; idx < params.nn; idx++) {
        if (times[idx] < tmin) {
          tmin = times[idx];
          imin = idx;
        }
      }

      //Update all potentials and waiting times
      for (idx = 0; idx < params.nn; idx++) {
        //Preliminary pots., w/o the spike at imin
        v[idx]=params.ir*(1-Math.exp(-(tmin)/params.rc))+v[idx]*Math.exp(-tmin/params.rc);
        //Now the stochastic spike transmission
        if (Math.random() < params.q) {
          v[idx] = v[idx] + params.A*params.syn[idx*params.nn+imin];
        }
        //Now add excitation due to video input...
  
        times[idx] = params.rc*Math.log((v[idx]-params.ir)/(params.theta-params.ir));
      }
  
      v[imin]=0;
      times[imin]=params.rc*Math.log(-params.ir/(params.theta-params.ir));
      time = time+tmin;
      spktms[imin].push(time);
    }

    return [v, times, time, spktms];
  }

  function updatePoints(pts, v, params) {

    var geometry = pts.geometry;
    for (i = 0; i < params.nn; i++) {
      var color = new THREE.Color();
      t = Math.min(Math.max(v[i]/params.theta, 0), 1);
      if (params.rec[i] == true) {
        var vx = 1; //Math.random();
        var vy = 1-t; //Math.random();
        var vz = 1-t; //Math.random();
      }
      else {
        var vx = .3+0.4*(1-t); //Math.random();
        var vy = .3+0.4*(1-t); //Math.random();
        var vz = .3+0.4*(1-t); //Math.random();
      }
      color.setRGB( vx, vy, vz );
      colors[ i ] = color;
    }
    geometry.colors = colors; 
    pts.geometry.colorsNeedUpdate = true;
  }

  function addNodes(scene) {

    data = [ [-.28,-.17], [-.39,.47], [-.09,.14], [0.57,-.06], [.76,-0.17], [.95,0.01],
     [.91,0.51], [0.41, 0.7], [0.76, 1.06], [0.14, 1.29], 
     [-.28, 1.06], [-.03, 0.75], [0.2, 0.41]];
    var size = 1;
    var imsize = 3;

    var nP = 13;
    var pts = [];
    var ptsize = 0.2;

    //var ptGeometry = new THREE.BufferGeometry();
    //var ptPositions = new Float32Array( nP*3 );
    //var ptColors = new Float32Array( nP*3 );

    geometry = new THREE.Geometry();
    colors = [];

    for ( var i = 0; i < nP; i++ ) {

      var color = new THREE.Color();
      // colors
      var vx = 1; //Math.random();
      var vy = 1; //Math.random();
      var vz = 1; //Math.random();

      color.setRGB( vx, vy, vz );

      var x = data[i][0];
      var y = data[i][1];
      var z = 0;

      var px = 0;
      var py = 2*size*x/imsize;
      var pz = -2*size*y/imsize;

      //ptPositions[3*i] = pz;
      //ptPositions[3*i+1] = py;
      //ptPositions[3*i+2] = px;

      //ptColors[3*i] = vx;
      //ptColors[3*i+1] = vy;
      //ptColors[3*i+2] = vz;

      var vertex = new THREE.Vector3();
      vertex.x = pz;
      vertex.y = py;
      vertex.z = px;
      geometry.vertices.push( vertex );
      colors[ i ] = color;
    }

    geometry.colors = colors; 

    //ptGeometry.addAttribute( 'position', new THREE.BufferAttribute( ptPositions, 3 ) );
    //ptGeometry.addAttribute( 'color', new THREE.BufferAttribute( ptColors, 3 ) );
    //ptGeometry.computeBoundingBox();

    //var ptMaterial = new THREE.PointsMaterial( { size: ptsize, vertexColors: THREE.VertexColors, map: sprite } );
    //var pts = new THREE.Points( ptGeometry, ptMaterial );
    //scene.add(pts);

    var sprite = new THREE.TextureLoader().load( "textures/sprites/disc.png" );
    material = new THREE.PointsMaterial( { size: ptsize, map: sprite, vertexColors: THREE.VertexColors, alphaTest: 0.5, transparent: true } );
    material.color.setHSL( 1.0, 0.2, 0.7 );
    particles = new THREE.Points( geometry, material );
    scene.add( particles );

    return particles;
  }

  window.samples.neuralnetwork3 = {

    initialize: function(canvas) {
      var scene = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera( 30, sample_defaults.width / sample_defaults.height, 1, 1000 );
      camera.position.set(0, 0, 3);
      camera.lookAt( new THREE.Vector3(0,0,0));

      //Init LIF model
      [params, v, times] = initLIF();
      var time = 0;
      spktms = new Array(params.nn);
      for (idx = 0; idx < params.nn; idx++) {
        spktms[idx] = [0];
      }
      var tf = 1;
      var dt = .4;
      var cx = 0;
      var cy = 0;
      var theta = 0;      console.log(params);
      console.log(v);
      console.log(spktms);

      // create the video element
      //video = document.createElement( 'video' );
      //video.src = "assets/twinpeaks.mp4";
      //video.load(); // must call after setting/changing source
      //video.play();
      //videoImage = document.createElement( 'canvas' );
      //videoImage.width = 480;
      //videoImage.height = 360;
      //
      //videoImageContext = videoImage.getContext( '2d' );
      //// background color if no video present
      //videoImageContext.fillStyle = '#ff0000';
      //videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
      //
      //var videoTexture = new THREE.Texture( videoImage );
      //videoTexture.minFilter = THREE.LinearFilter;
      //videoTexture.magFilter = THREE.LinearFilter;
      //var material1 = new THREE.MeshBasicMaterial({ map : videoTexture });
      //var geometry1 = new THREE.PlaneGeometry( .8, .6, 32 );
      //var vidplane = new THREE.Mesh( geometry1, material1 );
      //vidplane.position.x += .7;
      //vidplane.position.y += .15;
      //scene.add( vidplane );

      var gcurs = new THREE.PlaneGeometry( .05, .05 );
      var mat = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
      var cur = new THREE.Mesh( gcurs, mat );
      scene.add( cur );
      cur.position.x = 1+cx;
      cur.position.y = .2+cy;

      pts = addNodes(scene);

      var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
      renderer.setSize( sample_defaults.width, sample_defaults.height );

      //var controls = new THREE.OrbitControls( camera, renderer.domElement );

      var instance = { active: false };
      function animate() {
        requestAnimationFrame( animate, canvas );
        if(!instance.active || sample_defaults.paused) return;

        //if(video.readyState === video.HAVE_ENOUGH_DATA){
        //  //draw video to canvas starting from upper left corner
        //  videoImageContext.drawImage(video, 0, 0);
        //  //tell texture object it needs to be updated
        //  videoTexture.needsUpdate = true;
        //}
        //plane.rotation.y += 0.008;

        //Step LIF model forward
        [v, times, time, spktms] = LIF(tf, v, times, params, time, spktms);
        tf = tf + dt;

        //Extract recent activity and change size of points
        updatePoints(pts, v, params)
        renderer.render( scene, camera );

        cx += 0.003*Math.random();
        cy += 0.003*Math.random();
        cx /= 1.05;
        cy /= 1.05;
        theta += 0.02;
        cur.position.x = 0.8+0.05*Math.cos(theta) + 5*cx;
        cur.position.y = .2+0.05*Math.sin(theta) + 5*cy;

      }

      animate();
      return instance;
    }
  };
})();
