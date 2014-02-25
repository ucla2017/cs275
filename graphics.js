
var Graphics = ( function () {

	var Graphics = { REVISION: '01' };

	var camera, scene, renderer;
	var cameraCube, sceneCube;

	var mesh, lightMesh, geometry;
	var spheres = [];
	var birdBox;

	var morphs = [];
	
	var animRemainTime = 0;
	var animBeginTime = 650;

	var directionalLight, pointLight;


	var cylinderHeight = 40;

	Graphics.init = function (container) {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
			camera.position.z = 50;

			cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );

			scene = new THREE.Scene();
			sceneCube = new THREE.Scene();

			var radiusTop = 1.5;
			var segmentsRadius = 50;
			var segmentsHeight = 50;
			var radiusBottom = radiusTop;

			var geometry = new THREE.CylinderGeometry( radiusTop, radiusBottom, cylinderHeight, segmentsRadius, segmentsHeight);

			var gh = "https://raw.github.com/jiangong01/cs275/master/"
			var path = "textures/cube/skybox/";
			var format = '.jpg';
			var urls = [
				gh + path + 'px' + format, gh + path + 'nx' + format,
				gh + path + 'py' + format, gh + path + 'ny' + format,
				gh + path + 'pz' + format, gh + path + 'nz' + format
			];

			var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
			var material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube, refractionRatio: 0.95 } );
			var material2 = new THREE.MeshPhongMaterial( { ambient: 0x4EB81A, color: 0x4EB81A, specular: 0x4EB81A, shininess: 30, shading: THREE.FlatShading } );

			for ( var i = 0; i < 20; i ++ ) {

				var mesh = new THREE.Mesh( geometry, material2 );

				mesh.position.x = Math.random() * 100 - 50;
				mesh.position.y = Math.random() * 100 - 50;
				mesh.position.z = Math.random() * 100 - 50;

				mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

				scene.add( mesh );

				spheres.push( mesh );

			}

			birdBox = new THREE.BoxHelper();
			birdBox.material.color.setRGB( 1, 0, 0 );
			birdBox.scale.set( 1, 1, 1 );
			birdBox.position.set(0, 0, 0);
			scene.add( birdBox );

			// Skybox
			initSkybox(textureCube);
			function initSkybox(textureCube) {
				var shader = THREE.ShaderLib[ "cube" ];
				shader.uniforms[ "tCube" ].value = textureCube;

				var material = new THREE.ShaderMaterial( {

					fragmentShader: shader.fragmentShader,
					vertexShader: shader.vertexShader,
					uniforms: shader.uniforms,
					depthWrite: false,
					side: THREE.BackSide

				} ),

				mesh = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100 ), material );
				sceneCube.add( mesh );
			}

			// LIGHTS

			hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
			hemiLight.color.setHSL( 1, 1, 1 );
			hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
			hemiLight.position.set( 0, 500, 0 );
			scene.add( hemiLight );

			// MORPHS
			function morphColorsToFaceColors( geometry ) {

				if ( geometry.morphColors && geometry.morphColors.length ) {

					var colorMap = geometry.morphColors[ 0 ];

					for ( var i = 0; i < colorMap.colors.length; i ++ ) {

						geometry.faces[ i ].color = colorMap.colors[ i ];

					}

				}

			}

			var loader = new THREE.JSONLoader();

			var startX = 0;

			loader.load( "models/animated/parrot.js", function( geometry ) {

				morphColorsToFaceColors( geometry );

				geometry.computeMorphNormals();

				var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, morphNormals: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );
				var meshAnim = new THREE.MorphAnimMesh( geometry, material );

				meshAnim.duration = 1000;
				meshAnim.time = animBeginTime;

				var s = 0.05;
				meshAnim.scale.set( s, s, s );
				meshAnim.position.set(0, 0, 0);
				meshAnim.position = birdBox.position;
				meshAnim.rotation.y = Math.PI / 2;

				meshAnim.castShadow = true;
				meshAnim.receiveShadow = true;

				scene.add( meshAnim );
				morphs.push( meshAnim );

				
			} );

			//
			renderer = new THREE.WebGLRenderer();
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.autoClear = false;
			container.appendChild( renderer.domElement );
	};

	Graphics.resizeWindow = function () {

		windowHalfX = window.innerWidth / 2,
		windowHalfY = window.innerHeight / 2,

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		cameraCube.aspect = window.innerWidth / window.innerHeight;
		cameraCube.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	};

	Graphics.update = function (mouseX, mouseY, delta, elapseTime, pillars, bird) {


		for ( var i = 0, il = 10; i < il; i += 1 ) {

			var sphere1 = spheres[ i*2 ];
			var sphere2 = spheres[ i*2 + 1 ];

			sphere1.position.x = pillars[i].x;
			sphere1.position.y = pillars[i].y + pillars[i].h/2 + cylinderHeight / 2;
			sphere1.position.z = 0;

			sphere2.position.x = pillars[i].x;
			sphere2.position.y = pillars[i].y - pillars[i].h/2 - cylinderHeight / 2;
			sphere2.position.z = 0;
		}

		// animate bird
		
		birdBox.position.x = -bird.w / 2;
		birdBox.position.y = bird.y - bird.h / 2;

		if (animRemainTime > 0) {

			animRemainTime -= delta;

			for ( var i = 0; i < morphs.length; i ++ ) {

				morph = morphs[ i ];
				morph.updateAnimation( 1000 * delta );
				morph.position.x = birdBox.position.x;
				morph.position.y = birdBox.position.y;
			}
		}

		// update camera
		camera.position.x += ( mouseX / 40.0 - camera.position.x ) * .05;
		camera.position.y += ( - mouseY / 40.0 - camera.position.y ) * .05;

		camera.lookAt( scene.position );
		cameraCube.rotation.copy( camera.rotation );

		// update status and log text
		str = 'mouseX = ' + mouseX + ', mouseY = ' + mouseY + ', ';
		str += 'delta = ' + delta.toFixed(2) + ', ';
		str += 'ElapsedTime = ' + elapseTime.toFixed(2) + ', ';
		str += 'animRemainTime = ' + animRemainTime.toFixed(2) + ', ';
		str += 'bird.x = ' + bird.x + ', bird.y = ' + bird.y.toFixed(2) + ', ';
		str += 'pillars[0].x = ' + pillars[0].x.toFixed(2) + '<br>';
		Graphics.setStatus(str);
		if (Math.round(elapseTime*10) % 10 == 0) {
			Graphics.setLog('...');
		}

		renderer.render( sceneCube, cameraCube );
		renderer.render( scene, camera );

	};

	Graphics.flapWings = function () {
		if (animRemainTime <= 0) {

			animRemainTime = 1;

			for ( var i = 0; i < morphs.length; i ++ ) {

				morph = morphs[ i ];
				morph.time = animBeginTime;

			}
		}
	};

	Graphics.setBirdPosition = function (x, y, z) {
		for ( var i = 0; i < morphs.length; i ++ ) {

			morph = morphs[ i ];
			morph.position.set(x, y, z);

		}
	};

	Graphics.setStatus = function (text) {
		document.getElementById('status').innerHTML = text;
	};

	Graphics.setLog = function (text) {
		document.getElementById('log').innerHTML = text;
	};

	return Graphics;

}() );

