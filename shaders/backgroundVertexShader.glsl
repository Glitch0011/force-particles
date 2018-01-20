varying vec2 outUV;
			
void main()
{
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	outUV = uv;
	
	gl_Position = projectionMatrix * mvPosition;
}