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
import * as merlinapi from "./merlin-api.js";

// Re-export needed functions
export {setCredentials} from "./merlin-api.js";

/******************************************************************************************************
 * Global cache
 ******************************************************************************************************/
let cachedGroupModel = undefined;
let cachedMasteryProgressModel = undefined;



/****************************************************************************************************
 * GroupModel
 ****************************************************************************************************/
function GroupModel(data) {
    this.groups = ko.observableArray(data);
}

export function loadGroupsUnderAuthority() {
    let successHandler = function (data) {
        if (typeof cachedGroupModel !== "undefined") {
	    cachedGroupModel.groups(data);
	} else {
            cachedGroupModel = new GroupModel(data);
            ko.applyBindings(cachedGroupModel, document.getElementById('merlin-groups-under-authority-tree'));
	}
    }
    let errorHandler = function(error) {
        console.error(error.message);
    }
    merlinapi.GroupModel.loadGroupsUnderAuthority(successHandler, errorHandler, 'readStudentSashes');
}

/****************************************************************************************************
 * MasteryProgressModel
 ****************************************************************************************************/
function MasteryProgressModel(data, username) {
    this.username = ko.observable(username);
    this.masteryProgresses = ko.observableArray(data);
}

export function loadMasteryProgress(username, groupUnderAuthority) {
    let successHandler = function (data) {
    	if (typeof cachedMasteryProgressModel !== "undefined") {
	    console.log(`Reloading cache for ${username}`);
	    cachedMasteryProgressModel.username(username);
	    cachedMasteryProgressModel.masteryProgresses(data);

	} else {
	    cachedMasteryProgressModel = new MasteryProgressModel(data, username);
	    ko.applyBindings(cachedMasteryProgressModel, document.getElementById('merlin-proficiency-progress-table'));
	    ko.applyBindings(cachedMasteryProgressModel, document.getElementById('merlin-proficiency-progress-header'));
	}
    }
    let errorHandler = function(error) {
        console.error(error.message);
    }
    merlinapi.MasteryProgressModel.loadForUser(successHandler, errorHandler,
					       groupUnderAuthority,
				               username);
}
      
