attribute vec3 birdColor;
			
varying vec4 outColour;

uniform float time;

uniform sampler2D texturePosition;
uniform float textureResolution;

uniform float pointSize;
uniform float pointAlpha;

void main()
{
	vec3 texPos = texture2D(texturePosition, vec2(position.x / textureResolution, position.y / textureResolution)).xyz;
	
	vec4 mvPosition = modelViewMatrix * vec4( texPos, 1.0 );

	outColour = vec4(0, 0, 0, pointAlpha);
	
	gl_PointSize = pointSize;

	gl_Position = projectionMatrix * mvPosition;
}