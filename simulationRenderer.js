function SimulationRenderer(WIDTH, renderer, effectController)
{
	var BOUNDS = Math.pow(2, 11);
	var BOUNDS_HALF = BOUNDS / 2.0;
	
	this.nowMousePos = THREE.Vector2(0, 0);
	this.lastMousePos = THREE.Vector2(0, 0);
	this.brushRandom = 0.0;
	this.brushSize = 0.0;
	
	console.log("Bounds: " + BOUNDS);
	this.getBounds = function getBounds()
	{
		return BOUNDS;
	}
	
	var camera = new THREE.Camera();
	camera.position.z = 1;

	// Init RTT stuff
	gl = renderer.getContext();

	if ( !gl.getExtension( "OES_texture_float" )) 
	{
		alert( "No OES_texture_float support for float textures!" );
		return;
	}

	if ( gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0)
	{
		alert( "No support for vertex shader textures!" );
		return;
	}

	var scene = new THREE.Scene();

	var uniforms =
	{
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2( WIDTH, WIDTH ) },
		texture: { type: "t", value: null }
	};

	var passThruShader = new THREE.ShaderMaterial( 
	{
		uniforms: uniforms,
		vertexShader: ShaderStorage['vertexShader'],
		fragmentShader: ShaderStorage['fragmentShader'],
	});

	var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry( 2, 2 ), passThruShader);

	var positionShader = new THREE.ShaderMaterial( 
	{
		uniforms:
		{
			time: { type: "f", value: 1.0 },
			delta: { type: "f", value: 0.0 },
			resolution: { type: "v2", value: new THREE.Vector2( WIDTH, WIDTH ) },
			forceResolution: { type: "v2", value: new THREE.Vector2( BOUNDS, BOUNDS )  },
			texturePosition: { type: "t", value: null },
			textureVelocity: { type: "t", value: null },
			textureForce: { type: "t", value: null },
			maxSpeed: { type: "f", value: 50.0 },
		},
		vertexShader: ShaderStorage['vertexShader'],
		fragmentShader: ShaderStorage['fragmentShaderPosition'],
	} );

	this.positionShader = positionShader;
	
	var forceShader = new THREE.ShaderMaterial( 
	{
		uniforms:
		{
			resolution: { type: "v2", value: new THREE.Vector2( WIDTH, WIDTH ) },
			forceResolution: { type: "v2", value: new THREE.Vector2( BOUNDS, BOUNDS )  },
			textureForce: { type: "t", value: null },
			lastMousePos: { type: "v2", value: null },
			nowMousePos: { type: "v2", value: null },
			brushSize: { type: "f", value: null },
			brushRandom: { type: "f", value: null },
		},
		vertexShader: ShaderStorage['vertexShader'],
		fragmentShader: ShaderStorage['fragmentShaderForce'],
	} );

	this.positionShader = positionShader;

	scene.add( mesh );

	var flipflop = true;
	var rtPosition1, rtPosition2, rtForce, rtForce2;

	function init()
	{
		rtPosition1 = getRenderTarget( THREE.RGBAFormat );
		rtPosition2 = rtPosition1.clone();
		
		rtForce = getRenderTargetWithSize(THREE.RGBFormat, BOUNDS);
		rtForce2 = rtForce.clone();
		
		//Create position-data-texture and copy it into the render-target
		{
			var dtPosition = generatePositionTexture();
			simulator.renderTexture(dtPosition, rtPosition1);
		}
		
		//Create force-map		
		{
			var dtForceMap = generateForceTexture();
			simulator.renderTextureWithResolution(dtForceMap, rtForce, BOUNDS);
		}
		
		this.lastMousePos = new THREE.Vector2(0,0);
		this.nowMousePos = new THREE.Vector2(0,0);
		
		this.flopForce(0);
	}
	
	function getPos()
	{
		return rtPosition1;
	}
	
	this.forceSwap = true;
	this.flipping = false;
	
	this.getForce = function()
	{
		if (this.forceSwap)
		{
			return rtForce;
		}
		else
		{
			return rtForce2;
		}
	}
	
	this.flopForce = function(delta)
	{
		if (this.forceSwap)
		{
			simulator.renderForce( rtForce, rtForce2, delta);
		}
		else
		{
			simulator.renderForce(  rtForce2, rtForce, delta);
		}

		this.forceSwap = !this.forceSwap;
	}
	
	this.init = init;
	
	this.getPos = getPos;
	
	function getRenderTarget(type)
	{
		return getRenderTargetWithSize(type, WIDTH);
	}
	
	function getRenderTargetWithSize(type, size)
	{
		var renderTarget = new THREE.WebGLRenderTarget(size, size, 
		{
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: type,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
			generateMipmaps: false,
		});

		return renderTarget;
	}

	this.renderTextureWithResolution = function ( input, output, resolution )
	{
		mesh.material = passThruShader;
		uniforms.resolution.value = new THREE.Vector2( resolution, resolution );
		uniforms.texture.value = input;
		renderer.render( scene, camera, output );
	}
	
	// Takes a texture, and render out as another texture
	this.renderTexture = function ( input, output )
	{
		this.renderTextureWithResolution(input, output, WIDTH);
	}
	
	this.renderPosition = function(position, velocity, output, delta)
	{
		mesh.material = positionShader;
		positionShader.uniforms.texturePosition.value = position;
		positionShader.uniforms.textureForce.value = this.getForce();
		positionShader.uniforms.time.value = performance.now();
		positionShader.uniforms.delta.value = delta;
		positionShader.uniforms.maxSpeed.value = effectController.MaxSpeed;
		
		renderer.render( scene, camera, output );
		this.currentPosition = output;
	}
	
	this.renderForce = function(input, output)
	{
		mesh.material = forceShader;
		forceShader.uniforms.textureForce.value = input;
		forceShader.uniforms.lastMousePos.value = this.lastMousePos;
		forceShader.uniforms.nowMousePos.value = this.nowMousePos;
		forceShader.uniforms.brushRandom.value = this.brushRandom;
		forceShader.uniforms.brushSize.value = this.brushSize;

		renderer.render(scene, camera, output);
	}
	
	this.simulate = function( delta )
	{
		if (flipflop)
		{
			simulator.renderPosition( rtPosition1, 0, rtPosition2, delta);
		}
		else
		{
			simulator.renderPosition( rtPosition2, 0, rtPosition1, delta);
		}

		if (this.flipping)
		{
			if (this.lastMousePos.x == this.nowMousePos.x && this.lastMousePos.y == this.nowMousePos.y)
				return

			this.flopForce(delta);
		}
		
		flipflop = !flipflop;
	}

	function generatePositionTexture() 
	{
		var a = new Float32Array( WIDTH * WIDTH * 4 );

		for ( var k = 0, kl = a.length; k < kl; k += 4 ) 
		{
			var x = Math.random() * BOUNDS - BOUNDS_HALF;
			var y = Math.random() * BOUNDS - BOUNDS_HALF;

			a[ k + 0 ] = x; //Pos X
			a[ k + 1 ] = y; //Pos Y
			a[ k + 2 ] = 0; //Vel X
			a[ k + 3 ] = 0; //Vel Y
		}

		var texture = new THREE.DataTexture( a, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType );
		
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		texture.flipY = false;

		return texture;
	}

	function generateVelocityTexture() 
	{
		var a = new Float32Array( WIDTH * WIDTH * 4 );

		for ( var k = 0, kl = a.length; k < kl; k += 4)
		{
			a[ k + 0 ] = 0;
			a[ k + 1 ] = 0;
			a[ k + 2 ] = 0;
			a[ k + 3 ] = 0;
		}

		var texture = new THREE.DataTexture( a, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType );
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		texture.flipY = false;

		return texture;
	}
	
	function generateForceTexture() 
	{
		var a = new Float32Array( BOUNDS * BOUNDS * 3 );

		var i =0;
		for (var y = 0.0; y < BOUNDS; y++)
		{
			for (var x = 0.0; x < BOUNDS; x++)
			{
				var pos = new THREE.Vector2(x - BOUNDS_HALF, y - BOUNDS_HALF);
				var centre = new THREE.Vector2(0, 0);
				
				var result;
				
				if (pos.sub(centre).length() < BOUNDS / 4.0)
				{
					result = (pos.sub(centre)).normalize();
				}
				else
				{
					result = (centre.sub(pos)).normalize();
				}
				
				result = result.add(new THREE.Vector2(((Math.random() - 0.5) * 2.0), ((Math.random() - 0.5) * 2.0)).multiplyScalar(2.5));
				
				result.normalize();

				a[i + 0] = result.x;
				a[i + 1] = result.y;
				a[i + 2] = 0.0;
				
				i += 3;
			}
		}

		var texture = new THREE.DataTexture( a, BOUNDS, BOUNDS, THREE.RGBFormat, THREE.FloatType );
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		texture.flipY = false;

		return texture;
	}
}