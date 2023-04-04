/******************************************************************************************************
  MerlinWikiExtensions Extends the functionality of the wiki by adding
  extensions for Merlin-specific capabilities.
  Copyright (C) 2023 CoderMerlin.Academy
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*******************************************************************************************************/
import * as jquery from "https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js";
import * as knockout from "./knockout-min.js";

/******************************************************************************************************
 * Errors
 ******************************************************************************************************/
export class MerlinError {
    constructor(message) {
	this.message = message;
    }
}

export class MerlinAjaxError extends MerlinError {
    constructor(xmlhttprequest, url) {
	super(`${xmlhttprequest.status} (${xmlhttprequest.statusText}) while invoking '${url}'.`);
    }
    
}

/******************************************************************************************************
 * First subdomain detection (e.g. 'www' or 'stg')
 ******************************************************************************************************/
export function subdomain() {
    const host = window.location.hostname;
    const first = host.split('.')[0].toLowerCase();
    return first;
}

/******************************************************************************************************
 * Language Server URL (based on subdomain)
 ******************************************************************************************************/
export function languageServerURL() {
    const url = (subdomain() == "stg") ?
	  "https://language-server-stg.codermerlin.academy/" :
	  "https://language-server.codermerlin.academy/";
    return url;
}

/******************************************************************************************************
 * API Server URL (based on subdomain)
 ******************************************************************************************************/
export function apiServerURL() {
    const url = (subdomain() == "stg") ?
	  "https://api-server-stg.codermerlin.academy/" :
	  "https://api-server.codermerlin.academy/";
    return url;
}

/******************************************************************************************************
 * Code Explorer Language Information
 * Returns an array of data required for CodeExplorer
 * [mode, sourceLanguage, sourceFileSuffix, iconURL]
 ******************************************************************************************************/
export function dataFromLanguage(language) {
    switch(language) {
    case "assembly":
	return ["gas", "assemblyX8664", "s", "/wiki/images/a/a0/ASMIcon.png"];
    case "c":
	return ["clike", "c", "c", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/The_C_Programming_Language_logo.svg/300px-The_C_Programming_Language_logo.svg.png"];
    case "cpp":
	return ["clike", "cpp", "cpp", "https://upload.wikimedia.org/wikipedia/commons/1/18/ISO_C%2B%2B_Logo.svg"];
    case "java":
	return ["clike", "java", "java", "/wiki/images/6/66/Java_programming_language_logo.svg.png"];
    case "python":
	return ["python", "python", "py", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/300px-Python-logo-notext.svg.png"];
    case "swift":
	return ["swift", "swift", "swift", "/wiki/images/thumb/3/3b/Swift-og.png/300px-Swift-og.png"];

    }
}

/******************************************************************************************************
 * Converts crlf to <br/> for html
 ******************************************************************************************************/
export function consoleToHTML(consoleText) {
    let html = "";

    if (consoleText) {
	html = consoleText;
	html = html.replace(/(?:\r\n|\r|\n)/g, '<br/>');
	html = html.replace(/\s/g, '&nbsp;');
    }

    return html;
}


/*****************************************************************************************************
******************************************************************************************************
* AJAX APIS
* Most APIs have the first four parameters as:
* successHandler(data)
* errorHandler(merlinAjaxError)
* username
* sessionID
*
* Exceptions may occur if authentication is not required
******************************************************************************************************
******************************************************************************************************/
export class MissionModel {
    static from(json){
	let model = new MissionModel();
	model.id = json.id;
	model.name = json.name;
	model.sequence = json.sequence;
	model.suffix = json.suffix;
	return model
    }

    static load(handle, successHandler, errorHandler,
		masteryProgramID, topicID) {
	const url = `${apiServerURL()}/v1/mission-manager/mastery-programs/${masteryProgramID}/topics/${topicID}/missions`;
	// Response is array of missions
	// {
	//     "id": 73,
	//     "name": "Conditionals Level 1",
	//     "sequence": 1151,
	//     "suffix": 10
	// }
	let response = $.ajax({
	    type: "GET",
	    url,
	    dataType: "json",
	    error: function(xmlhttprequest) {
		let error = new MerlinAjaxError(xmlhttprequest, url);
		errorHandler(handle, error);
	    },
	    success: function(data) {
		let models = [];
		data.forEach(element => models.push(MissionModel.from(element)));
		successHandler(handle, models);
	    },
	    timeout: 2500 
	});
    }

    standardName() {
	return `M${this.sequence}-${this.suffix} ${this.name}`;
    }
}


export class MasteryProgressModel {
    static from(json) {
	let model = new MasteryProgressModel();

	// Read from json
	model.id = json.id;
	model.userId = json.userId;

	model.masteryProgramId = json.masteryProgramId;
	model.masteryProgramName = json.masteryProgramName;

	model.masteryProgramTopicSequence = json.masteryProgramTopicSequence;
	model.masteryProgramLevelName = json.masteryProgramLevelName;
	model.masteryProgramTopicName = json.masteryProgramTopicName;
	
	model.pointsEarned = json.pointsEarned;
	model.totalPoints = json.totalPoints;

	model.emergingMinimumPoints = json.emergingMinimumPoints;
	model.developingMinimumPoints = json.developingMinimumPoints;
	model.proficientMinimumPoints = json.proficientMinimumPoints;
        model.exemplaryMinimumPoints = json.exemplaryMinimumPoints;

	// Read from json only on demand
	model.missions = ko.observableArray([]);

	// Not read from json
	model.shouldShowMissions = ko.observable(false);
	
	return model;
    }

    static load(successHandler, errorHandler, username, sessionID) {
	const url = `${apiServerURL()}/v1/mission-manager/users/${username}/mastery-progress/programs`;
	// Response is array of progress
	// {
	// 	  "id": "2",   // masteryProgramTopicId
	// 	  "userId": 3,
	//
	// 	  "masteryProgramId": 1,
	// 	  "masteryProgramName": "Merlin Coder White"
	//
	// 	  "masteryProgramTopicSequence": 100,
	// 	  "masteryProgramLevelName": "White 1",
	// 	  "masteryProgramTopicName": "Basic CLI Software Development Tools",
	//
	// 	  "pointsEarned": 0,
	// 	  "totalPoints": 150,
	//
	// 	  "emergingMinimumPoints": 75,
	// 	  "developingMinimumPoints": 98,
	// 	  "proficientMinimumPoints": 120,
	// 	  "exemplaryMinimumPoints": 135,
	// }
	let response = $.ajax({
	    type: "GET",
	    url,
	    headers: {
		"username": username,
		"sessionID": sessionID
	    },
	    dataType: "json",
	    error: function(xmlhttprequest) {
		let error = new MerlinAjaxError(xmlhttprequest, url);
		errorHandler(error);
	    },
	    success: function(data) {
		let models = [];
		data.forEach(element => models.push(MasteryProgressModel.from(element)));
		successHandler(models);
	    },
	    timeout: 25000 
	});
    }


    standardName() {
	return `${this.masteryProgramLevelName}: ${this.masteryProgramTopicName}`;
    }

    color() {
	const firstWord = this.standardName().split(" ")[0];
	switch (firstWord) {
	case "White": return "white";
	case "Yellow": return "yellow";
	case "Orange": return "orange";
	}
    }

    emergingClassName() {
	if (this.pointsEarned >= this.emergingMinimumPoints) {
	    return "merlin-proficiency-progress-complete"
	} else if (this.pointsEarned > 0) {
	    return "merlin-proficiency-progress-partial"
	} else {
	    return "merlin-proficiency-progress-none"
	}
    }

    developingClassName() {
	if (this.pointsEarned >= this.developingMinimumPoints) {
	    return "merlin-proficiency-progress-complete"
	} else if (this.pointsEarned > this.emergingMinimumPoints) {
	    return "merlin-proficiency-progress-partial"
	} else {
	    return "merlin-proficiency-progress-none"
	}
    }

    proficientClassName() {
	if (this.pointsEarned >= this.proficientMinimumPoints) {
	    return "merlin-proficiency-progress-complete"
	} else if (this.pointsEarned > this.developingMinimumPoints) {
	    return "merlin-proficiency-progress-partial"
	} else {
	    return "merlin-proficiency-progress-none"
	}
    }

    exemplaryClassName() {
	if (this.pointsEarned >= this.exemplaryMinimumPoints) {
	    return "merlin-proficiency-progress-complete"
	} else if (this.pointsEarned > this.proficientMinimumPoints) {
	    return "merlin-proficiency-progress-partial"
	} else {
	    return "merlin-proficiency-progress-none"
	}
    }

    arrowInnerText() {
	if (this.shouldShowMissions()) {
	    return String.fromCharCode(0x25BC); // Down arrow
	} else {
	    return String.fromCharCode(0x25B6); // Right arrow
	};
    }

    // Event handlers
    toggleMissionDisplay() {
	this.shouldShowMissions(!this.shouldShowMissions());
	if (this.shouldShowMissions()) {
	    this.updateMissions();
	}
    }

    updateMissions() {
	let successHandler = function(handle, models) {
	    handle.missions(models);
	}
	let errorHandler = function(handle, error) {
	    console.error(error.message);
	}

	// Load missions if they haven't yet been loaded
	if (this.missions().length == 0) {
	    MissionModel.load(this, successHandler, errorHandler, this.masteryProgramId, this.id);
	}
    }

}


export function intialize() {
}


