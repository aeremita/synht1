
var update = false; //si TRUE se actualizan los valores de filtro, amp, pitch, etc
var grid=20; // tamano de la grilla

var env1;
var env2; //ENVELOPE
var lowpass1; //LOWPASS FILTER
var lowpass2;
var osc1; //osc1ILATOR
var osc2;
var pulseOsc1; //PWM 1
var pulseOsc2;
var noiseOsc; //Noise osc1ILATOR
var LFOosc1;
var LFOosc2;

var LFOosc1amp=0;
var LFOosc2amp=0;
var LFOosc1fil=0;
var LFOosc2fil=0;
var LFOpan=0;

var fft;
var LFOanalyzer;

//PARA CALCULAR TIEMPO ELAPSED (NO LO USO AUN)
var initTime;
var et;

//BPM Y SEQUENCER
var seqFunc;
var seqOn = false;
var BPMinterv;
var BPM;

var currentFreq;


var notasTexto = []; //arreglo con notas en texto C1 C#1 hasta B5 | A4 es la nro 45!
var notasFreq = []; //arreglo con notas en frequencias

var iseq=-1; //contador para el sequencer
var secuencia = [0,0,0,0,0,0,0,0]; //arreglo del sequencer
var seqInput = [] //arreglo de inputs para ingresar notas
var seqPreset1 = ["F4","E4","F4","A4","F4","E4","F4","D4"];

var p1;


const SEQSIZE = 8;


//myPART TEST
var myPhrase, myPart;

function setup() {
  createCanvas(grid*50, grid*30);
  textAlign(LEFT);
  textSize(grid*0.65);

  showElements();

  var p1 = createP("Seq1");

  p1.position(grid*20,grid*26);
  p1.style("text-decoration","underline");
  p1.style("color","blue");
  p1.mouseClicked(loadP1);

  env1 = new p5.Env();
  env2 = new p5.Env();
  lowpass1 = new p5.LowPass();
  lowpass2 = new p5.LowPass();
  osc1 = new p5.Oscillator();
  osc2 = new p5.Oscillator();
  pulseOsc1 = new p5.Pulse(440);
  pulseOsc2 = new p5.Pulse(440);
  noiseOsc = new p5.Noise();
  LFOosc1 = new p5.Oscillator();
  LFOosc2 = new p5.Oscillator();

  currentFreq=440;

  MasterLowPass = new p5.LowPass();
  MasterHiPass = new p5.HighPass();
  MasterGain = new p5.Gain();
  osc1Gain = new p5.Gain();
  osc2Gain = new p5.Gain();

  rev = new p5.Reverb();
  del = new p5.Delay();

  fft = new p5.FFT(0.8,256);
  LFOanalyzer = new p5.Amplitude();


  osc1.setType(typetotxt(typeSlide.value()));
  osc2.setType(typetotxt(typeSlide2.value()));
  LFOosc1.setType(typetotxt(LFOtype.value()));
  LFOosc2.setType(typetotxt(LFOtype.value()));

  osc1.freq(currentFreq);
  osc2.freq(currentFreq);
  pulseOsc1.freq(currentFreq);
  pulseOsc2.freq(currentFreq);
  LFOosc1.freq(0.5);
  LFOosc2.freq(0.5);

  osc1.amp(0);
  pulseOsc1.amp(0);
  osc2.amp(0);
  pulseOsc2.amp(0);
  noiseOsc.amp(0);
  LFOosc1.amp(10);
  LFOosc2.amp(10);
  osc1.disconnect();
  pulseOsc1.disconnect();
  osc2.disconnect();
  pulseOsc2.disconnect();
  noiseOsc.disconnect();
  LFOosc1.disconnect();
  LFOosc2.disconnect();
  osc1.connect(lowpass1);
  pulseOsc1.connect(lowpass1);
  osc2.connect(lowpass2);
  pulseOsc2.connect(lowpass2);
  noiseOsc.connect(lowpass1);
  lowpass1.disconnect();
  lowpass2.disconnect();
  lowpass1.connect(osc1Gain);
  lowpass2.connect(osc2Gain);
  osc1Gain.disconnect();
  osc1Gain.connect(MasterLowPass);
  osc2Gain.disconnect();
  osc2Gain.connect(MasterLowPass);


  MasterLowPass.disconnect();
  MasterLowPass.connect(MasterHiPass);
  MasterHiPass.disconnect();
  MasterHiPass.connect(MasterGain);
  MasterGain.connect();

  rev.process(MasterGain,3,2);
  del.process(MasterGain);
  del.setType(1);

  lowpass1.process(osc1,LPSlide.value(),LPResSlide.value());
  lowpass2.process(osc2,LPSlide2.value(),LPResSlide2.value());

  osc1.start();
  osc2.start();
  LFOosc1.start();
  LFOosc2.start();

  //initTime = Date.now();

  // GENERAR ARRAY CON NOMBRE DE NOTAS
  for (var i=1;i<6;i++)
  {
   notasTexto.push("C"+i);
   notasTexto.push("C#"+i);
   notasTexto.push("D"+i);
   notasTexto.push("Eb"+i);
   notasTexto.push("E"+i);
   notasTexto.push("F"+i);
   notasTexto.push("F#"+i);
   notasTexto.push("G"+i);
   notasTexto.push("Ab"+i);
   notasTexto.push("A"+i);
   notasTexto.push("Bb"+i);
   notasTexto.push("B"+i);
  }

  //generar array con freq de notas
  for (var i = 0 ; i < notasTexto.length; i++)
   notasFreq.push(pow(2,(i-45)/12)*440);

  parseSeq();
  updateADSR();
  updateFilter();
  updateTone();
  updateLFO();

  del.drywet(0);
  rev.drywet(0);
}

function draw()
{
  background(240);
  noFill();
  //VER GRID
  //stroke(200);
  //for (var x = 0 ; x < width ; x+=grid)
  // for (var y = 0 ; y < height ; y+=grid)
  //  rect(x,y,grid,grid);

  showText(); //puts text and lines on screen;

  push();
  var waveform = fft.waveform();
  beginShape();
  stroke(255,255,224); // waveform is red
  strokeWeight(3);
  noFill();
  translate(grid*12.5,grid*5);
  scale(0.2,0.2);
  for (var i = 0; i< waveform.length; i++){
    var x = map(i, 0, waveform.length, 0, width);
    var y = map( waveform[i], -1, 1, 0, height);
    vertex(x,y);
  }
  endShape();
  pop();

  if (update)
  {
    updateADSR();
    updateTone();
    updateFilter();
    updateLFO();
  }
    BPM = BPMSlide.value();
    BPMinterv = (60000/BPM)*(4/pow(2,BPMstep.value()));

}

function setType()
{
  if (typeSlide.value()<4)
  {
   osc1.start();
   osc1.setType(typetotxt(typeSlide.value()));
   pulseOsc1.stop();
   noiseOsc.stop();
  }
  else if (typeSlide.value()==4)
 {
  osc1.stop();
  noiseOsc.stop();
  pulseOsc1.start();
  }
  else if (typeSlide.value()==5)
  {
    osc1.stop();
    pulseOsc1.stop();
    noiseOsc.start();
  }
 }

 function setType2()
 {
   if (typeSlide2.value()<4)
   {
    osc2.start();
    osc2.setType(typetotxt(typeSlide2.value()));
    pulseOsc2.stop();
   }
   else if (typeSlide2.value()==4)
  {
   osc2.stop();
   pulseOsc2.start();
   }
  }

  function setTypeLFO()
  {
    LFOosc1.setType(typetotxt(LFOtype.value()));
    LFOosc2.setType(typetotxt(LFOtype.value()));

  }

function updateADSR()
{

  env1.setADSR(attackSlide.value()+0.01,decaySlide.value(),+sustainSlide.value(),releaseSlide.value()+0.01);
  env2.setADSR(attackSlide.value()+0.01,decaySlide.value(),+sustainSlide.value(),releaseSlide.value()+0.01);
  var vol1 = map(ABmixSlide.value(),0,5,0,1,true);
  var vol2 = map(ABmixSlide.value(),5,10,1,0,true);
  env1.setRange(vol2+0.01,0);
  env2.setRange(vol1+0.01,0);
  osc1.amp(env1);
  pulseOsc1.amp(env1);
  osc2.amp(env2);
  pulseOsc2.amp(env2);
  noiseOsc.amp(env1);

  osc1Gain.amp(volSlide.value()+LFOosc1amp,0.1);
  osc2Gain.amp(volSlide2.value());

  MasterGain.amp(MVolumeSlide.value());
}

function updateFilter()
{
  lowpass1.freq(LPSlide.value());
  lowpass1.res(LPResSlide.value());
  lowpass2.freq(LPSlide2.value());
  lowpass2.res(LPResSlide2.value());
  MasterLowPass.freq(MLowPassSlide.value());
  MasterHiPass.freq(MHiPassSlide.value());
}

function updateTone()
{
 if (seqOn)
  currentFreq=secuencia[iseq];
 else {
   currentFreq=440;
 }
 if (secuencia[iseq]==0)
 {
  osc1.freq(0);
  osc2.freq(0);
 }
 else
 {
  osc1.freq(currentFreq+pitchSlide.value()+fineSlide.value());
  osc2.freq(currentFreq+pitchSlide2.value()+fineSlide2.value());
  pulseOsc1.freq(currentFreq+pitchSlide.value()+fineSlide.value());
  pulseOsc2.freq(currentFreq+pitchSlide2.value()+fineSlide2.value());

  LFOosc1.amp(LFO2pitch1.value());
  LFOosc2.amp(LFO2pitch2.value());

  if (LFO2pitch1.value()>0)
  {
    LFOosc1.freq(LFOrate.value());

    if (typeSlide.value()==4)
      pulseOsc1.freq(LFOosc1);
    else
      osc1.freq(LFOosc1);
  }

  if (LFO2pitch2.value()>0)
  {
    LFOosc2.freq(LFOrate.value());
    if (typeSlide2.value()==4)
      pulseOsc2.freq(LFOosc2);
    else
      osc2.freq(LFOosc2);
  }



 }

 pulseOsc1.width(PWMSlide.value());
 pulseOsc2.width(PWMSlide2.value());

 osc1.pan(PanSlide.value());
 osc2.pan(PanSlide.value());
 pulseOsc1.pan(PanSlide.value());
 pulseOsc2.pan(PanSlide.value());
}

function updateFX()
 {
  del.drywet(delayDW.value());
  del.delayTime(delayT.value());
  del.feedback(delayFB.value());
  if (delayPingPong.checked())
   del.setType(1);
  else
   del.setType(0);

  rev.drywet(reverbDW.value());
  rev.set(reverbTime.value(),reverbDecay.value(),reverbReverse.checked());
 }

 function updateLFO()
 {
   LFOanalyzer.setInput(LFOosc1);

   LFOosc1amp = LFOanalyzer.getLevel();
   console.log(LFOosc1amp);

  //  sin(TWO_PI*millis()/1000*LFOrate.value())*LFO2amp1.value();
  // LFOosc2amp = sin(TWO_PI*millis()/1000*LFOrate.value())*LFO2amp2.value();
  // LFOosc1fil = sin(TWO_PI*millis()/1000*LFOrate.value())*LFO2filt1.value();
//   LFOosc2fil = sin(TWO_PI*millis()/1000*LFOrate.value())*LFO2filt1.value();
//   LFOpan = sin(TWO_PI*millis()/1000*LFOrate.value())*LFO2pan.value();



 }




function startNote()
{
  update = true;
  env1.triggerAttack();
  env2.triggerAttack();

}

function endNote() {
  env1.triggerRelease();
  env2.triggerRelease();

  update=false;
}

function keyPressed() {

 if (keyCode === 32)
 {
    update = true;
    env1.triggerAttack();
    env2.triggerAttack();

 }
 //else if (keyCode === ENTER)

}

function keyReleased()
{
  if (keyCode === 32)
   env1.triggerRelease();
   env2.triggerRelease();

   update = false;
}


function showElements()
{
  ////OSC1
  pitchSlide = createSlider(-100, 100, 0, 1);
  pitchSlide.position(grid*2, grid*2);
  pitchSlide.size(grid*10);

  fineSlide = createSlider(-10, 10, 0, 0.1);
  fineSlide.position(grid*13, grid*2);
  fineSlide.size(grid*10);

  volSlide = createSlider(0, 1, 0.8,0.1);
  volSlide.position(grid*2, grid*4);

  typeSlide = createSlider(0, 5, 0, 1);
  typeSlide.position(grid*2, grid*6);
  typeSlide.size(grid*3);
  typeSlide.changed(setType);

  //PMWSlide

  LPSlide = createSlider(10, 20000, 20000, 1);
  LPSlide.position(grid*2, grid*8);

  LPResSlide = createSlider(0, 30, 0, 1);
  LPResSlide.position(grid*2, grid*10);

  //PWMSlide
  PWMSlide = createSlider(0,1,0.5,0.05);
  PWMSlide.size(grid*3);
  PWMSlide.position(grid*6-10,grid*6);

  ////OSC2 dif gridX 25

  pitchSlide2 = createSlider(-100, 100, 0, 1);
  pitchSlide2.position(grid*27, grid*2);
  pitchSlide2.size(grid*10);

  fineSlide2 = createSlider(-10, 10, 0, 0.1);
  fineSlide2.position(grid*38, grid*2);
  fineSlide2.size(grid*10);

  volSlide2 = createSlider(0, 1, 0.8,0.1);
  volSlide2.position(grid*27, grid*4);

  typeSlide2 = createSlider(0, 4, 0, 1);
  typeSlide2.position(grid*27, grid*6);
  typeSlide2.size(grid*3);
  typeSlide2.changed(setType2);

  //PMWSlide2

  LPSlide2 = createSlider(10, 20000, 20000, 1);
  LPSlide2.position(grid*27, grid*8);

  LPResSlide2 = createSlider(0, 30, 0, 1);
  LPResSlide2.position(grid*27, grid*10);

  //PWMSlide
  PWMSlide2 = createSlider(0,1,0.5,0.05);
  PWMSlide2.size(grid*3);
  PWMSlide2.position(grid*31-10,grid*6);



  //Master Filters
  MLowPassSlide = createSlider(20,20000,20000,1);
  MLowPassSlide.position(grid*27,grid*14);
  MLowPassSlide.size(grid*5);
  MHiPassSlide = createSlider(20,20000,20,1);
  MHiPassSlide.position(grid*27,grid*16);
  MHiPassSlide.size(grid*5);

  //LFO
  LFOrate = createSlider(0.5,10,1,0.5);
  LFOrate.position(grid*34,grid*14)
  LFOrate.size(grid*4);
  LFOtype = createSlider(0,3,0,1);
  LFOtype.position(grid*34,grid*16);
  LFOtype.size(grid*4);
  LFOtype.changed(setTypeLFO);
  LFO2pitch1 = createSlider(0,100,0,1);
  LFO2pitch1.size(grid*3);
  LFO2pitch1.position(grid*37+10,grid*15);
  LFO2pitch1.style("rotate",270);
  LFO2pitch2 = createSlider(0,100,0,0.1);
  LFO2pitch2.size(grid*3);
  LFO2pitch2.position(grid*39,grid*15);
  LFO2pitch2.style("rotate",270);
  LFO2amp1 = createSlider(0,1,0,0.1);
  LFO2amp1.size(grid*3);
  LFO2amp1.position(grid*40+10,grid*15);
  LFO2amp1.style("rotate",270);
  LFO2amp2 = createSlider(0,2,0,0.1);
  LFO2amp2.size(grid*3);
  LFO2amp2.position(grid*42,grid*15);
  LFO2amp2.style("rotate",270);
  LFO2filt1 = createSlider(0,1,0,0.1);
  LFO2filt1.size(grid*3);
  LFO2filt1.position(grid*43+10,grid*15);
  LFO2filt1.style("rotate",270);
  LFO2filt2 = createSlider(0,1,0,0.1);
  LFO2filt2.size(grid*3);
  LFO2filt2.position(grid*45,grid*15);
  LFO2filt2.style("rotate",270);
  LFO2pan = createSlider(0,1,0,0.1);
  LFO2pan.size(grid*3);
  LFO2pan.position(grid*46+10,grid*15);
  LFO2pan.style("rotate",270);

  //ENVELOP
  attackSlide = createSlider(0, 2, 0, 0.1);
  attackSlide.position(grid, grid*15);
  attackSlide.size(grid*3);
  attackSlide.style("rotate",270);

  decaySlide = createSlider(0, 1, 0.1, 0.1);
  decaySlide.position(grid*2+5, grid*15);
  decaySlide.size(grid*3);
  decaySlide.style("rotate",270);

  sustainSlide = createSlider(0, 1, 0.8, 0.1);
  sustainSlide.position(grid*3+5, grid*15);
  sustainSlide.size(grid*3);
  sustainSlide.style("rotate",270);

  releaseSlide = createSlider(0, 2, 0, 0.1);
  releaseSlide.position(grid*4+5, grid*15);
  releaseSlide.size(grid*3);
  releaseSlide.style("rotate",270);

  ///END ENVELOPE

  //MIX
  ABmixSlide = createSlider(0,10,5,0.1);
  ABmixSlide.position(grid*2,grid*20-10);
  MVolumeSlide = createSlider(0,1,0.8,0.1);
  MVolumeSlide.position(grid*2,grid*21);
  PanSlide = createSlider(-1,1,0,0.1);
  PanSlide.position(grid*9,grid*20-10);

  //FX
  delayDW = createSlider(0,1,0,0.1);
  delayDW.position(grid*27,grid*19+10);
  delayDW.size(grid*4);
  delayDW.changed(updateFX);
  delayT = createSlider(0,1,0.3,0.1);
  delayT.position(grid*33,grid*19+10);
  delayT.size(grid*4);
  delayT.changed(updateFX);
  delayFB = createSlider(0,0.9,0.5,0.1);
  delayFB.position(grid*39,grid*19+10);
  delayFB.size(grid*4);
  delayFB.changed(updateFX);
  delayPingPong = createCheckbox('Ping Pong',false);
  delayPingPong.position(grid*44,grid*19+10);
  delayPingPong.changed(updateFX);


  reverbDW = createSlider(0,1,0,0.1);
  reverbDW.position(grid*27,grid*21+10);
  reverbDW.size(grid*4);
  reverbDW.changed(updateFX);
  reverbTime = createSlider(0,10,3,0.5);
  reverbTime.position(grid*33,grid*21+10);
  reverbTime.size(grid*4);
  reverbTime.changed(updateFX);
  reverbDecay = createSlider(0,10,2,1);
  reverbDecay.position(grid*39,grid*21+10);
  reverbDecay.size(grid*4);
  reverbDecay.changed(updateFX);
  reverbReverse = createCheckbox('Reverse',false);
  reverbReverse.position(grid*44,grid*21+10);
  reverbReverse.changed(updateFX);


  //TRIGGER Y SEQUENCER
  trigBtn = createButton("Trigger");
  trigBtn.position(grid*21,grid*17);
  trigBtn.mousePressed(startNote);
  trigBtn.mouseReleased(endNote);

  BPMSlide = createSlider(60,180,100,1);
  BPMSlide.position(grid,grid*25+10);
  BPMSlide.size(grid*5);
  BPMlenght = createSlider(0,100,50,5);
  BPMlenght.position(grid,grid*27);
  BPMlenght.size(grid*5);
  BPMstep = createSlider(0,5,2,1);
  BPMstep.size(grid*5);
  BPMstep.position(grid,grid*29-10);

  seqBtn = createButton("SEQUENCER");
  seqBtn.position(grid*1,grid*24+5);
  seqBtn.mousePressed(startSeq);

  //DIBUJAR CUADROS PARA SECUENCIA
  for (var i = 0 ; i < SEQSIZE; i++)
  {
  seqInput[i] = createInput();
  seqInput[i] .value("A4");
  seqInput[i] .size(grid*2);
  seqInput[i] .position(grid*14+(i*grid*2),grid*24+5);
 }
}

function showText()
{
  textSize(grid*0.65);
  stroke(100);
  strokeWeight(1);
  line(width/2,grid/2 ,width/2,grid*20);
  stroke(0);
  rect(grid/2,grid/2,width/2-grid,grid*12); //osc11 rect
  rect(width/2+grid/2,grid/2,width/2-grid,grid*12); // osc12 rect
  rect(grid/2,grid*13,width/2-grid,grid*5); //ENV RECT
  rect(width/2+grid/2,grid*13,grid*7,grid*5); //FILT RECT
  rect(width/2+grid*8,grid*13,grid*16+10,grid*5); //LFO RECT
  rect(grid/2,grid*18+10,width/2-grid,grid*5); //VOL RECT
  rect(width/2+grid/2,grid*18+10,width/2-grid,grid*5); //FX RECT

  stroke(200);
  fill(20);
  rect(grid*12.6,grid*5,grid*10,grid*6); // osc11 osc1ilosc1opio


  noStroke();
  fill(240);
  rect(grid-2,2,grid*2,grid); //fondo osc11
  rect(width/2+grid-2,2,grid*2,grid); //fondoosc12
  rect(grid-2,grid*13-6,grid*1.5,grid);//Env fondo
  rect(width/2+grid-2,grid*13-6,grid*1.5,grid);//Filt fondo
  rect(width/2+grid*8+grid/2,grid*13-6,grid*1.5,grid);//LFO fondo
  rect(grid-2,grid*18+4,grid*2,grid);//mix fondo
  rect(width/2+grid-2,grid*18+4,grid*1,grid);//fx fondo


  fill(0);

  //OSC1
  text('osc1',grid,grid*0.75)
  text('osc2',width/2+grid,grid*0.75);
  text('Pitch Ajuste: '+pitchSlide.value(),grid*2,grid*3+8);
  text('Ajuste Fino: '+fineSlide.value(),grid*13,grid*3+8);
  text('Vol: '+volSlide.value(),grid*2,grid*5+9);
  text(typetotxt(typeSlide.value()),grid*2,grid*7+9);
  text('LowPass Freq: '+LPSlide.value(),grid*2,grid*9+8);
  text('LowPass Res: '+LPResSlide.value(),grid*2,grid*11+8);
  text('PWM '+PWMSlide.value(),grid*5+10,grid*7+9);

  //OSC2
  text('Pitch Ajuste: '+pitchSlide2.value(),grid*27,grid*3+8);
  text('Ajuste Fino: '+fineSlide2.value(),grid*38,grid*3+8);
  text('Vol: '+volSlide2.value(),grid*27,grid*5+9);
  text(typetotxt(typeSlide2.value()),grid*27,grid*7+9);
  text('LowPass Freq: '+LPSlide2.value(),grid*27,grid*9+8);
  text('LowPass Res: '+LPResSlide2.value(),grid*27,grid*11+8);
  text('PWM '+PWMSlide2.value(),grid*30+10,grid*7+9);

  text("ENV",grid-2,grid*13-6,grid*2,grid);
  text("FILT",width/2+grid,grid*13-6,grid*2,grid);
  text("Low Pass: "+MLowPassSlide.value(),grid*27,grid*16-grid/2);
  text("HiPass: "+MHiPassSlide.value(),grid*27,grid*18-grid/2);

  text("LFO",width/2+grid*9-10,grid*13-6,grid*2,grid);

  text("LFO rate"+LFOrate.value(),grid*34,grid*15+10);
  text(typetotxt(LFOtype.value()),grid*34,grid*17+10);

  textSize(grid*0.55);
  text("osc1f osc2f osc1a osc2a   fil1     fil2    pan",grid*38,grid*17+10);

  textSize(grid*0.65);
  text('A:'+attackSlide.value()+
       ' D:'+decaySlide.value()+
       ' S:'+sustainSlide.value()+
       ' R:'+releaseSlide.value(),grid*2-5,grid*18-grid/2);

  text('MIX',grid-2,grid*18+4,grid*2,grid);
  text('OSC 1           OSC 2',grid*2,grid*21-10);
  text('Master Volume: '+MVolumeSlide.value(),grid*2,grid*23-10);
  text('L      PAN       R',grid*10-5,grid*21);

  text('FX',width/2+grid,grid*18+4,grid*2,grid);
  text('Delay Vol: '+delayDW.value(),grid*27,grid*21);
  text('Delay time: '+delayT.value(),grid*33,grid*21);
  text('Delay feedback: '+delayFB.value(),grid*38,grid*21);

  text('Reverb Vol: '+reverbDW.value(),grid*27,grid*23);
  text('Reverb time: '+reverbTime.value(),grid*33,grid*23);
  text('Reverb decay: '+reverbDecay.value(),grid*38,grid*23);

  text('BPM: '+BPMSlide.value(),grid*6,grid*26);
  text('Note Lenght: '+ BPMlenght.value(),grid*6,grid*27.5);
  text('Step: 1/'+pow(2,BPMstep.value()),grid*6,grid*29);
  text("SEQUENCER: "+(seqOn?"SI":"NO"),grid*6,grid*25-5);
  stroke(255,0,0);
  strokeWeight(3);
  if (iseq>-1)
   line(grid*14+(iseq*grid*2)-5,grid*25, grid*14+(iseq*grid*2)+grid*1.6-5,grid*25)// dibuja linea debajo del step
  //noStroke();
  //text('['+iseq+'] Array: '+floor(secuencia[iseq])+' currF:'+floor(currentFreq)+' osc1F:'+floor(osc1.f), grid*2+(iseq*grid*2)-5, height-20);
}

//traduce el value de tipo de osc1ilador a un string
function typetotxt(nt)
{
  var retStr="sine";
  if (nt === 0)
   retStr="sine";
  else if (nt === 1)
   retStr="triangle";
  else if (nt === 2)
   retStr="sawtooth";
  else if (nt === 3)
   retStr="square";
  else if (nt === 4)
   retStr="pulse";
  else if (nt === 5)
   retStr="noise";
  return retStr;
}

function loadP1()
{
  for (var i = 0 ; i < SEQSIZE; i++)
  {
  seqInput[i] .value(seqPreset1[i]);

 }
}

function startSeq()
{
  if(!seqOn)
  {
   seqOn=true;
   update=true;
   parseSeq();
   seqFunc();


  }
  else
  {
    seqOn=false;
    update=false;
    iseq=-1;
  }
}

function seqFunc()
{
  if (seqOn)
  {
    // text('['+iseq+']'+secuencia[iseq]+' '+osc1.f, grid*2+(iseq*grid*2)-5, grid*27);
  if (iseq==7)
    iseq=-1;
  iseq++;
  parseSeq();
  currentFreq=secuencia[iseq];
  //updateTone();

  var notelenght = BPMinterv*(BPMlenght.value()/100000);
  env1.play(null, 0, notelenght);
  env2.play(null, 0, notelenght);





  setTimeout(seqFunc, BPMinterv);

  }
}

//funcion que lee todos los inputs del secuencer, los busca en la tabla de freq y los carga en el arreglo se la secuencia
function parseSeq()
{
 for (var i = 0; i < seqInput.length; i++)  {
  var found = false;
  for (var j=0;j < notasTexto.length; j++)   {
   if (seqInput[i].value()===notasTexto[j])
   {
    found = true;
    secuencia[i]=notasFreq[j];
    //console.log("FOUND");
   }

  }
  if (!found)
  {
   secuencia[i]=0;
   //console.log("NOTFOUND");
  }
 }
}
