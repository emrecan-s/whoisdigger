/** global: appSettings */
var whois = require('../../common/whoiswrapper.js'),
  conversions = require('../../common/conversions.js'),
  fs = require('fs'),
  bwFileContents;

require('../../common/stringformat.js');

const {
  ipcRenderer
} = require('electron');

const {
  tableReset
} = require('./auxiliary.js');

// File input, path and information confirmation container
ipcRenderer.on('bw:fileinput.confirmation', function(event, filePath = null, isDragDrop = false) {
  var bwFileStats; // File stats, size, last changed, etc
  const {
    misc,
    lookup
  } = appSettings;

  //console.log(filePath);
  if (filePath === undefined || filePath == '' || filePath === null) {
    //console.log(filePath);
    $('#bwFileinputloading').addClass('is-hidden');
    $('#bwEntry').removeClass('is-hidden');
  } else {
    $('#bwLoadingInfo').text('Loading file stats...');
    if (isDragDrop === true) {
      $('#bwEntry').addClass('is-hidden');
      $('#bwFileinputloading').removeClass('is-hidden');
      bwFileStats = fs.statSync(filePath);
      bwFileStats['filename'] = filePath.replace(/^.*[\\\/]/, '');
      bwFileStats['humansize'] = conversions.byteToHumanFileSize(bwFileStats['size'], misc.usestandardsize);
      $('#bwFileSpanInfo').text('Loading file contents...');
      bwFileContents = fs.readFileSync(filePath);
    } else {
      bwFileStats = fs.statSync(filePath[0]);
      bwFileStats['filename'] = filePath[0].replace(/^.*[\\\/]/, '');
      bwFileStats['humansize'] = conversions.byteToHumanFileSize(bwFileStats['size'], misc.usestandardsize);
      $('#bwFileSpanInfo').text('Loading file contents...');
      bwFileContents = fs.readFileSync(filePath[0]);
    }
    $('#bwFileSpanInfo').text('Getting line count...');
    bwFileStats['linecount'] = bwFileContents.toString().split('\n').length;

    if (lookup.randomize.timebetween === true) {
      bwFileStats['minestimate'] = conversions.msToHumanTime(bwFileStats['linecount'] * lookup.randomize.timebetweenmin);
      bwFileStats['maxestimate'] = conversions.msToHumanTime(bwFileStats['linecount'] * lookup.randomize.timebetweenmax);

      $('#bwFileSpanTimebetweenmin').text('{0}ms '.format(lookup.randomize.timebetweenmin));
      $('#bwFileSpanTimebetweenmax').text('/ {0}ms'.format(lookup.randomize.timebetweenmax));
      $('#bwFileTdEstimate').text('{0} to {1}'.format(bwFileStats['minestimate'], bwFileStats['maxestimate']));
    } else {
      bwFileStats['minestimate'] = conversions.msToHumanTime(bwFileStats['linecount'] * lookup.timebetween);
      $('#bwFileSpanTimebetweenminmax').addClass('is-hidden');
      $('#bwFileSpanTimebetweenmin').text(lookup.timebetween + 'ms');
      $('#bwFileTdEstimate').text('> {0}'.format(bwFileStats['minestimate']));
    }



    bwFileStats['filepreview'] = bwFileContents.toString().substring(0, 50);
    //console.log(readLines(filePath[0]));
    //console.log(bwFileStats['filepreview']);

    //console.log(lineCount(bwFileContents));
    $('#bwFileinputloading').addClass('is-hidden');
    $('#bwFileinputconfirm').removeClass('is-hidden');

    // stats
    $('#bwFileTdName').text(bwFileStats['filename']);
    $('#bwFileTdLastmodified').text(conversions.getDate(bwFileStats['mtime']));
    $('#bwFileTdLastaccess').text(conversions.getDate(bwFileStats['atime']));
    $('#bwFileTdFilesize').text(bwFileStats['humansize'] + ' ({0} line(s))'.format(bwFileStats['linecount']));
    $('#bwFileTdFilepreview').text(bwFileStats['filepreview'] + '...');
    //$('#bwTableMaxEstimate').text(bwFileStats['maxestimate']);
    //console.log('cont:'+ bwFileContents);

    //console.log(bwFileStats['linecount']);
  }
});

// File Input, Entry container button
$('#bwEntryButtonFile').click(function() {
  $('#bwEntry').addClass('is-hidden');
  $.when($('#bwFileinputloading').removeClass('is-hidden').delay(10)).done(function() {
    ipcRenderer.send("bw:input.file");
  });
});

// File Input, cancel file confirmation
$('#bwFileButtonCancel').click(function() {
  $('#bwFileinputconfirm').addClass('is-hidden');
  $('#bwEntry').removeClass('is-hidden');
});

// File Input, proceed to bulk whois
$('#bwFileButtonConfirm').click(function() {
  var bwDomainArray = bwFileContents.toString().split('\n').map(Function.prototype.call, String.prototype.trim);
  var bwTldsArray = $('#bwFileInputTlds').val().toString().split(',');

  tableReset(bwDomainArray.length, bwTldsArray.length);
  $('#bwFileinputconfirm').addClass('is-hidden');
  $('#bwProcessing').removeClass('is-hidden');

  /*
  console.log(bwDomainArray);
  console.log(bwTldsArray);
  */

  ipcRenderer.send("bw:lookup", bwDomainArray, bwTldsArray);
});

// Bulk whois file input by drag and drop
(function() {
  var holder = $('#bwMainContainer');
  holder.ondragover = function() {
    return false;
  };

  holder.ondragleave = function() {
    return false;
  };

  holder.ondragend = function() {
    return false;
  };

  holder.ondrop = function(event) {
    event.preventDefault();
    for (let f of event.dataTransfer.files) {
      ipcRenderer.send('File(s) you dragged here: {0}'.format(f.path));
      ipcRenderer.send('ondragstart', f.path);
    }
    return false;
  };
})();

/*
$("html").on("dragover", function(event) {
    event.preventDefault();
    event.stopPropagation();
  console.log('dragging');
});

$("html").on("dragleave", function(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('dragging');
});

$("html").on("drop", function(event) {
    event.preventDefault();
    event.stopPropagation();
    alert("Dropped!");
});*/

$('#bwMainContainer').on('drop', function(event) {
  event.preventDefault();
  for (let f of event.originalEvent.dataTransfer.files) {
    ipcRenderer.send('File(s) you dragged here: {0}'.format(f.path));
    ipcRenderer.send('ondragstart', f.path);
  }
  return false;
});

$('#bwFileInputTlds').keyup(function(event) {
  // Cancel the default action, if needed
  event.preventDefault();
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Trigger the button element with a click
    $('#bwFileButtonConfirm').click();
  }
});
