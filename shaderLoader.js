/*var AEROTWIST = AEROTWIST || {};
AEROTWIST.Shaders = AEROTWIST.Shaders || {};*/

var ShaderStorage = [{}];

// on doc ready load them in
function loadShaders(onFinish)
{
	$("#loading").show();
		
	// get all the shaders from the DOM
	var fragmentShaders = $('script[type="x-shader/x-fragment"]');
	var vertexShaders	= $('script[type="x-shader/x-vertex"]');
	var shaderCount		= fragmentShaders.length + vertexShaders.length;
	
	/**
	 * Checks if we have finished loading
	 * all of the shaders in the DOM
	 */
	function checkForComplete()
	{
		if(!shaderCount)
		{
			onFinish();
		}
	}
	
	/**
	 * Loads a shader using AJAX
	 * 
	 * @param {Object} The script tag from the DOM
	 * @param {String} The type of shader [vertex|fragment]
	 */
	function loadShader(shader, type)
	{
		// wrap up the shader for convenience
		var $shader = $(shader);
	
		// request the file over AJAX
		$.ajax(
		{
			url: shader.src,
			dataType: "script",
			context:
			{
				name: shader.id,
				type: type,
			},
			complete: processShader
		});
	}
	
	/**
	 * Processes a shader that comes back from
	 * the AJAX and stores it in the Shaders
	 * Object for later on
	 * 
	 * @param {Object} The jQuery XHR object
	 * @param {String} The response text, e.g. success, error
	 */
	function processShader(jqXHR, textStatus)
	{
		// one down... some to go?
		shaderCount--;
		
		// store it and check if we're done
		ShaderStorage[this.name] = jqXHR.responseText;
		checkForComplete();
	}
	
	// load the fragment shaders
	for(var f = 0; f < fragmentShaders.length; f++)
	{
		var fShader = fragmentShaders[f];
		loadShader(fShader, 'fragment');
	}
	
	// and the vertex shaders
	for(var v = 0; v < vertexShaders.length; v++)
	{
		var vShader = vertexShaders[v];
		loadShader(vShader, 'vertex');
	}
	
	// there may be none so just
	// check that here
	checkForComplete();
}