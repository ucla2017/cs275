
var Graphics = ( function () {

	var Graphics = { REVISION: '01' };

	var camera, scene, renderer;
	var cameraCube, sceneCube;

	var mesh, lightMesh;
	var columsUp = [];
	var columsDown = [];
	var birdBox;

	var morphs = [];
	
	var animRemainTime = 0;
	var animBeginTime = 650;

	var directionalLight, pointLight;

	var fovyLine1, fovyLine2;

	var isDebugMode = false;
	var debugScene = [];

	var CR = 16.4;
	var CH = 6.4;


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
			

			var columGeometry;
			var columMaterial;

			new THREE.JSONLoader().load( "models/greeceColum.js", function( geometry, materials ) {
				//var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, morphNormals: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );
				//var material = new THREE.MeshLambertMaterial({color: 0x55B663});
				//var material = new THREE.MeshLambertMaterial({color: 0xffffff});
				columGeometry = geometry;
				columMaterial = new THREE.MeshFaceMaterial(materials);

				createCylinders(pillars);

				updateCylinders(pillars);
			});

			function createCylinders(pillars) {

				for ( var i = 0; i < pillars.length; i ++ ) {

					var p = pillars[ i ];

					makeOneCylinder(columsUp, Math.PI);

					makeOneCylinder(columsDown, 0);
					
				}

				function makeOneCylinder(colums, rotate) {

					// var radiusTop = 1;
					// var segmentsRadius = 50;
					// var segmentsHeight = 50;
					// var radiusBottom = radiusTop;
					// var height = 1;

					// var geometry = new THREE.CylinderGeometry( radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight);

					// var mesh = new THREE.Mesh( geometry, material );

					// mesh.scale.set(1, 1, 1);

					// scene.add( mesh );

					// spheres.push( mesh );


					
					// mesh = new THREE.Mesh( geometry, material );
					// mesh.position.set(0,0,0);
					// mesh.scale.set(1, 6.4, 1);
					// scene.add( mesh );

					// var radius = 1;
					// var height = 1;

					var mesh = new THREE.Mesh(columGeometry, columMaterial);
					mesh.position.set(0,0,0);
					mesh.rotation.x = rotate;
					mesh.scale.set(CR, CR, CR); // scale CR = 16.8 to make diameter unit 1, height CH = 6.4

					// columMesh.castShadow = true;
					// columMesh.receiveShadow = true;

					scene.add( mesh );
					colums.push( mesh );
				}
			}


			

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
			//scene.add( hemiLight );


			var light1 = new THREE.PointLight( 0xffffff, 2, 400);
			var light2 = new THREE.PointLight( 0xffffff, 2, 400);
			var light3 = new THREE.PointLight( 0xffffff);
			light1.position.set( 50, 0, 0 );
			light2.position.set( 0, 10, -10 );
			light3.position.set( -100, 0, 0 );
			//scene.add( light1 );
			//scene.add( light2 );
			scene.add( light3 );
			scene.add( new THREE.AmbientLight( 0x6B6B6A ) );

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

			

			// var daeLoader = new THREE.ColladaLoader();

			// daeLoader.load( "models/untitled.dae", function( collada ) {

			// 	var dae = collada.scene;
			// 	dae.position = birdBox.position;
			// 	dae.scale.set(50, 50, 50);
			// 	dae.updateMatrix();
			// 	scene.add( dae );
			// } );

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

		if (columsUp.length + columsDown.length < pillars.length * 2) return;

		for ( var i = 0; i < pillars.length; i ++ ) {

			var p = pillars[ i ];
			var r = p.w / 2 ;

			var mesh1 = columsUp[ i ];
			var mesh2 = columsDown[ i ];

			mesh1.position.x = p.x + p.w / 2;
			mesh1.position.y = p.y + p.h/2 + r * CH / 2;
			mesh1.position.z = 0;
			mesh1.scale.set( r * CR, r * CR, r * CR);

			mesh2.position.x = p.x + p.w / 2;
			mesh2.position.y = p.y - p.h/2 - r * CH / 2;
			mesh2.position.z = 0;
			mesh2.scale.set( r * CR, r * CR, r * CR);

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

