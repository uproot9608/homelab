/* eslint-disable */
const details = () => {
    return {
      id: "My_Tdarr_Plugin_Remove_Russian_Not_Dub",
      Stage: "Pre-processing",
      Name: "Remove Non Dub Russian Audio",
      Type: "Video",
      Operation: "Transcode",
      Description: `[Contains built-in filter] This plugin removes audio tracks which are not Russian Dub. It ensures at least 1 audio track is left in any language. \n\n`,
      Version: "0.02",
      Tags: "pre-processing,ffmpeg,audio only",
      Inputs:[],
    };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const plugin = (file, librarySettings, inputs, otherArguments) => {
      
      const lib = require('../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    //Must return this object
  
    var response = {
      processFile: false,
      preset: "",
      container: ".mp4",
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: "",
    };
  
    response.FFmpegMode = true;
  
    //check if files is video
  
    if (file.fileMedium !== "video") {
      console.log("File is not video");
  
      response.infoLog += "☒File is not video \n";
      response.processFile = false;
  
      return response;
    }
  
    var ffmpegCommandInsert = "";
    var audioIdx = -1;
    var rusAudioIdx = -1;
    var hasBadRusTracks = false;
    var audioStreamsRemoved = 0;
  
    //count number of russian audio streams
    var rusAudioStreamCount = file.ffProbeData.streams.filter(
      (row) => row.codec_type.toLowerCase() == "audio" &&
      row.tags.language.toLowerCase().includes("rus")
    ).length;
  
    console.log("rusAudioStreamCount:" + rusAudioStreamCount);
  
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      response.infoLog += "stream no: " + i + "\n";
      response.infoLog += "stream title: " + file.ffProbeData.streams[i].tags.title + "\n";
      //check if current stream is audio, update audioIdx if so
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          audioIdx++;
          response.infoLog += "\taudio: yes";
          response.infoLog += "\taudioIdx: " + audioIdx + "\n";
        } else{
          response.infoLog += "\taudio: no";
        }
      } catch (err) {}
  
      try {
        if ( // russian audio 
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
          file.ffProbeData.streams[i].tags.language.toLowerCase().includes("rus")
        )
        {
          response.infoLog += "\trussian audio: yes\n";
          rusAudioIdx++;
          response.infoLog += "\trusAudioIdx: " + rusAudioIdx + "\n";
          if (
            rusAudioIdx != 0 && // not first
            !(file.ffProbeData.streams[i].tags.title // not dub
              .toLowerCase()
              .includes("dub") ||
            file.ffProbeData.streams[i].tags.title
              .toLowerCase()
              .includes("дубляж") ||
            file.ffProbeData.streams[i].tags.title
              .toLowerCase()
              .includes("пифагор") ||
            file.ffProbeData.streams[i].tags.title
              .toLowerCase()
              .replace(/-/g,"")
              .includes("bluray")) 
            ) 
            {
              response.infoLog += "\tnot first and not dub - removing\n";
              audioStreamsRemoved++;
              ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
              hasBadRusTracks = true;
              response.infoLog += "\taudioStreamsRemoved:" + audioStreamsRemoved + "\n\t" + ffmpegCommandInsert + "\n";
            }
          if (audioStreamsRemoved == rusAudioStreamCount - 1){ // all tracks deleted
            break;
          }
        } else {
          response.infoLog += "\trussian audio: no";
        }
      } catch (err) {}
    }
  
    if (audioStreamsRemoved < rusAudioStreamCount - 1){ // at least one track passed criteria
      ffmpegCommandInsert += ` -map -0:a:0`; // remove first track
      response.infoLog += "\tffmpegCommandInsert:" + ffmpegCommandInsert + "\n";
    }
  
    if (hasBadRusTracks === true) {
      response.processFile = true;
      response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
      response.container = "." + file.container;
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog +=
        "☒File contains tracks which are not russian dub. Removing! \n";
      return response;
    } else {
      response.infoLog +=
        "☑File doesn't contain tracks which are not russian dub! \n";
    }
  
    response.processFile = false;
    return response;
  }
  
  module.exports.details = details;
  module.exports.plugin = plugin;
  