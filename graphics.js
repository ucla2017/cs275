
var Graphics = ( function () {

	var Graphics = { REVISION: '01' };

	var camera, scene, renderer;
	var cameraCube, sceneCube;

	var mesh, lightMesh;
	var spheres = [];
	var birdBox;

	var morphs = [];
	
	var animRemainTime = 0;
	var animBeginTime = 650;

	var directionalLight, pointLight;

	var fovyLine1, fovyLine2;

	var isDebugMode = false;
	var debugScene = [];


	var PillarHeight = 400;

	Graphics.init = function (container, bird, pillars) {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
			camera.position.z = 50;

			cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );

			scene = new THREE.Scene();
			sceneCube = new THREE.Scene();

			//var gh = "https://raw.github.com/jiangong01/cs275/master/"
			var gh = ""
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

			createCylinders(pillars, material2);

			function createCylinders(pillars, material) {
				

				for ( var i = 0; i < pillars.length; i ++ ) {

					var p = pillars[ i ];

					makeOneCylinder(material);

					makeOneCylinder(material);					
					
				}

				function makeOneCylinder(material) {

					var radiusTop = 1;
					var segmentsRadius = 50;
					var segmentsHeight = 50;
					var radiusBottom = radiusTop;
					var height = 1;

					var geometry = new THREE.CylinderGeometry( radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight);

					var mesh = new THREE.Mesh( geometry, material );

					mesh.scale.set(1, 1, 1);

					scene.add( mesh );

					spheres.push( mesh );
				}
			}


			updateCylinders(pillars);

			birdBox = new THREE.Mesh(new THREE.CubeGeometry(bird.w, bird.h, bird.h), new THREE.MeshBasicMaterial({
        							wireframe: true,
        							color: 'red'
      								}));
			birdBox.scale.set( 1, 1, 1 );
			birdBox.position.set(0, 0, 0);
			debugScene.push( birdBox );

			// create fovy line
			var fovyLen = 1000;
			var fovyLineX = fovyLen * Math.cos(bird.fovy * Math.PI / 360);
			var fovyLineY = fovyLen * Math.sin(bird.fovy * Math.PI / 360);
			fovyLine1 = createAxis(vertex(0, 0, 0), vertex(fovyLineX, fovyLineY, 0), 0xFFFFFF);
			fovyLine2 = createAxis(vertex(0, 0, 0), vertex(fovyLineX, -fovyLineY, 0), 0xFFFFFF);		


			//Create axis (point1, point2, colour)
			var axisLength = 1000;
			createAxis(vertex(-axisLength, 0, 0), vertex(axisLength, 0, 0), 0x0000FF);
    		createAxis(vertex(0, -axisLength, 0), vertex(0, axisLength, 0), 0x00FF00);
    		createAxis(vertex(0, 0, -axisLength), vertex(0, 0, axisLength), 0xFF0000);

			function vertex(x,y,z){ 
            	return new THREE.Vertex(new THREE.Vector3(x,y,z)); 
    		}

			function createAxis(p1, p2, color){
				var line, lineGeometry = new THREE.Geometry(),
				lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
				lineGeometry.vertices.push(p1, p2);
				lineGeometry.dynamic = true;
				line = new THREE.Line(lineGeometry, lineMat);
				//scene.add(line);
				debugScene.push( line );
				return lineGeometry;
			}

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

				var s = 0.05 * bird.h;
				meshAnim.scale.set( s, s, s );
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

	function updateCylinders(pillars) {
		for ( var i = 0; i < pillars.length; i ++ ) {

			var p = pillars[ i ];

			var sphere1 = spheres[ i*2 ];
			var sphere2 = spheres[ i*2 + 1 ];

			var h1 = PillarHeight / 2 - p.y + p.h / 2;
			sphere1.position.x = p.x + p.w / 2;
			sphere1.position.y = p.y + p.h/2 + h1 / 2;
			sphere1.position.z = 0;
			sphere1.scale.set( p.w / 2, h1, p.w / 2 );

			var h2 = p.y - p.h / 2 + PillarHeight / 2;
			sphere2.position.x = p.x + p.w / 2;
			sphere2.position.y = p.y - p.h/2 - h2 / 2;
			sphere2.position.z = 0;
			sphere2.scale.set( p.w / 2, h2, p.w / 2 );

		}
	}

	Graphics.update = function (mouseX, mouseY, delta, elapseTime, pillars, bird) {

		updateCylinders(pillars);

		//var fovyLineX = fovyLen * Math.cos(bird.fovy * Math.PI / 360);
		var fovyLen = 1000;
		var fovyLineY = fovyLen * Math.sin(bird.fovy * Math.PI / 360);
		fovyLine1.vertices[ 0 ].y = bird.y;
		fovyLine1.vertices[ 1 ].y = bird.y + fovyLineY;
		fovyLine2.vertices[ 0 ].y = bird.y;
		fovyLine2.vertices[ 1 ].y = bird.y - fovyLineY;
		fovyLine1.verticesNeedUpdate = true;
		fovyLine2.verticesNeedUpdate = true;

		// animate bird		
		//birdBox.scale.set( bird.w, bird.h, bird.h);
		birdBox.position.x = -bird.w / 2;
		birdBox.position.y = bird.y - bird.h / 2;

		if (animRemainTime > 0) {

			animRemainTime -= delta;

			for ( var i = 0; i < morphs.length; i ++ ) {

				morph = morphs[ i ];
				morph.updateAnimation( 1000 * delta );
				var s = 0.05 * bird.h;
				morph.scale.set( s, s, s );
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
		function p(x) {
			if (x == null) return "NaN";
			return x.toFixed(2);
		}		
		var str = 'current score = ' + curScore + ', max score = ' + maxScore + '<br>';
		str += 'generation = ' + generation + '<br>';
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

	Graphics.switchDebug = function (text) {
		for (var i = 0, len = debugScene.length; i < len; i++) {
			if (!isDebugMode) {
				scene.add( debugScene[i] );
			} else {
				scene.remove( debugScene[i] );
			}
		}
		isDebugMode = !isDebugMode;
	};

	return Graphics;

}() );

