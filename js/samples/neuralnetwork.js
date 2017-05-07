(function() {

  function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }
  
  function initLIF() {
    var params = {
    'N':10,
    'tau' : 0.020,
    'R' : 3e7,
    'E' : -0.070,
    'theta' : -0.030,
    'dt' : 0.0001,
    'tau_s' : 0.003,
    'Q' : 40,
    'I_0' : this.Q / this.tau_s,
    'arp' : 0.01
    };
    return params;

    I(1) = 0;
    // noise - sampling from norm/Gaussian dist, 1*no_steps matrix
    // random(A,B,C,[D,E])- what does B do!?
    randI = 3e-9 .* random('Normal', 0, 1.5, [1, no_steps]);
    // time since last spike
    t_spike = 0;

  }

  function LIF(V, I, params) {
    //Generate random input current plus inputs from other cells
    I(i+1) = I(i)-(dt/tau_s).*I(i);
    dV =(dt/tau).*(E-V(i)+I(i).*R + randI(i).*R);
    // update without noise
    // dV =(dt/tau).*(E-V(i)+I(i).*R);
    V(i+1) = V(i) + dV;
    if (V(i+1) > theta) 
      if no_spikes>0
          // check we're not in absolute refac period
          if (time(i)>=(t_spike+arp))
            // reset voltage
            V(i+1) = E;
            // Eleni's trick of making spikes look nice
            V(i) = -0;
            // record spike
            t_spike = time(i);
            // increment spike count
            no_spikes = no_spikes+1;
          end
      else
        // no spikes yet - no need to check
        V(i+1) = E;
        // Eleni's trick of making spikes look nice
        V(i) = -0;
        // record spike
        t_spike = time(i);
        // increment spike count
        no_spikes = no_spikes+1;
      end
    end

    return V;
  }

  window.samples.neuralnetwork = {

    initialize: function(canvas) {
      var scene = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera( 30, sample_defaults.width / sample_defaults.height, 1, 1000 );
      camera.position.set(0, 0, 3);
      camera.lookAt( new THREE.Vector3(0,0,0));

      //Init LIF model
      params = initLIF();
      var V = Array.apply(null, Array(params.N)).map(Number.prototype.valueOf,0);
      console.log(params);
      console.log(V);

      //var scale = 2.5;
      //var geometry = new THREE.CubeGeometry( scale, scale, scale );
      //var material = new THREE.MeshBasicMaterial( { color: 0xdddddd } );
      //var mesh = new THREE.Mesh( geometry, material );
      //scene.add( mesh );

      // create the video element
      video = document.createElement( 'video' );
      video.src = "assets/twinpeaks.mp4";
      video.load(); // must call after setting/changing source
      video.play();
      videoImage = document.createElement( 'canvas' );
      videoImage.width = 480;
      videoImage.height = 240;
      
      videoImageContext = videoImage.getContext( '2d' );
      // background color if no video present
      videoImageContext.fillStyle = '#ff0000';
      videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
      
      var videoTexture = new THREE.Texture( videoImage );
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      var material1 = new THREE.MeshBasicMaterial({ map : videoTexture });
      var geometry1 = new THREE.PlaneGeometry( .75, .75, 32 );
      var vidplane = new THREE.Mesh( geometry1, material1 );
      vidplane.position.x += .7;
      vidplane.position.y += .15;
      scene.add( vidplane );

      var geometry = new THREE.PlaneGeometry( .75, .75, 32 );
      var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
      var plane = new THREE.Mesh( geometry, material );
      plane.position.x -= .3;
      plane.position.y += .15;
      scene.add( plane );

      var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
      renderer.setSize( sample_defaults.width, sample_defaults.height );

      var instance = { active: false };
      function animate() {
        requestAnimationFrame( animate, canvas );
        if(!instance.active || sample_defaults.paused) return;

        if(video.readyState === video.HAVE_ENOUGH_DATA){
          //draw video to canvas starting from upper left corner
          videoImageContext.drawImage(video, 0, 0);
          //tell texture object it needs to be updated
          videoTexture.needsUpdate = true;
        }
        //plane.rotation.y += 0.008;

        renderer.render( scene, camera );
      }

      animate();
      return instance;
    }
  };
})();
