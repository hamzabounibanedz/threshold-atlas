package app.hamzabounibanedz.threshold;
import android.app.Instrumentation;
import android.graphics.Bitmap;
import android.content.Intent;
import android.os.SystemClock;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class Journey {
  private ActivityScenario<MainActivity> scenario;
  private final Instrumentation instrument=InstrumentationRegistry.getInstrumentation();
  private String js(String script) throws Exception {
    ArrayBlockingQueue<String> results=new ArrayBlockingQueue<>(1);
    scenario.onActivity(a->a.getBridge().getWebView().evaluateJavascript(script,value->results.offer(value==null?"null":value)));
    String value=results.poll(8,TimeUnit.SECONDS);
    assertNotNull("WebView response",value);
    return value;
  }
  private void waitFor(String expression) throws Exception {
    long deadline=SystemClock.elapsedRealtime()+60000;
    do { if("true".equals(js("Boolean("+expression+")"))) return; SystemClock.sleep(300); }while(SystemClock.elapsedRealtime()<deadline);
    fail("Timed out waiting for "+expression+" on "+js("location.hash+' '+document.body.innerText.slice(-950)"));
  }
  private String el(String name){return "document.querySelector('[data-test=\""+name+"\"]')";}
  private void click(String name) throws Exception {
    String element=el(name);
    waitFor(element+" && !"+element+".disabled");
    js(element+".scrollIntoView({block:'center'});"+element+".click()");
  }
  private void input(String name,String value) throws Exception{
    waitFor(el(name));
    js("(()=>{const e="+el(name)+";Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSONObject.quote(value)+");e.dispatchEvent(new Event('input',{bubbles:true}))})()");
  }
  private void has(String text) throws Exception{waitFor("document.body.innerText.includes("+JSONObject.quote(text)+")");}
  private void screenshot(String name) throws Exception{
    SystemClock.sleep(600);
    File folder=instrument.getTargetContext().getExternalFilesDir("evidence");
    assertNotNull(folder);
    Bitmap shot=instrument.getUiAutomation().takeScreenshot();
    assertNotNull(shot);
    try(FileOutputStream out=new FileOutputStream(new File(folder,name+".png"))){assertTrue(shot.compress(Bitmap.CompressFormat.PNG,100,out));}
  }
  @Test public void customerJourney() throws Exception {
    scenario=ActivityScenario.launch(new Intent(instrument.getTargetContext(),MainActivity.class));
    try{
      click("demo");waitFor(el("card-1"));screenshot("catalog");click("card-1");
      click("favorite");has("Saved to shortlist");click("option-09:00");click("reserve");has("Confirmed");
      screenshot("workflow");click("nav-profile");waitFor(el("profile-name"));input("profile-name","Device tester");js("document.querySelector('form').requestSubmit()");has("Profile saved");
      js("document.querySelector('select').value='dark';document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}))");waitFor("document.documentElement.dataset.theme==='dark'");screenshot("dark-profile");
      click("logout");waitFor(el("demo"));click("demo");click("nav-activity");has("Confirmed");
    }finally{scenario.close();}
  }
}

