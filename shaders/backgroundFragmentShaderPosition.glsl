uniform vec2 resolution;
uniform float time;
uniform float delta;

uniform sampler2D textureForce;

varying vec2 outUV;

void main()
{
	vec2 color = texture2D( textureForce, outUV).xy;
	gl_FragColor = vec4(((color + 1.0) / 2.0), 0.0, 1.0);
}