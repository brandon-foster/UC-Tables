(function($) {
        
    /**
     * @author Brandon Foster
     * @version 2013.05.22
     *
     * Dynamically create HTML tables from the UC Device Pricing XML data.
     */
    
    /**
     * Create a custom jquery selector :textEquals("string"). It is used in
     * the makeDataTables(String[], String[]) function to find xml tags with text
     * that exactly matches the group names.
     */
    $.expr[':'].textEquals = function(objNode, intStackIndex, arrProperties, arrNodeStack) {
        return $(objNode).text() == arrProperties[3];
    }
    
    /**
     * Modify DataTables sorting
     */
    $.fn.dataTableExt.oSort['price-asc']  = function(a,b) {
        a = (a == "N/A") ? 0 : parseFloat(a.replace('$', ""));
        b = (b == "N/A") ? 0 : parseFloat(b.replace('$', ""));
	return ((a < b) ? -1 : ((a > b) ?  1 : 0));
    };
 
    /**
     * Modify DataTables sorting
     */
    $.fn.dataTableExt.oSort['price-desc'] = function(a,b) {
        a = (a == "N/A") ? 0 : parseFloat(a.replace('$', ""));
        b = (b == "N/A") ? 0 : parseFloat(b.replace('$', ""));
	return ((a < b) ?  1 : ((a > b) ? -1 : 0));
    };
    
    /**
     * Parse the XML catalog
     */
    $(document).ready(function() {
        var $tableOutput = $('#tables-wrapper');
        $.ajax({
            type: "GET",
            url: "catalog.xml", // Use for local development
            //url: Drupal.settings.basePath + "xsql/atlas/uc_catalog.xsql", // Old pre-prod XML catalog
            //url: Drupal.settings.basePath + "xsql/atlas/uc/devices/catalog.xsql", // New pre-prod XML catalog
            dataType: "xml",
            success: function(xml) {
                handleXmlResponse(xml, $tableOutput);
            }
        });
        addLoadingMessage($tableOutput);
        addFootnotes($tableOutput);
    });
    
    /**
     * Create tables, populate them, and initialize DataTables
     * 
     * @param xml The XML file to create tables from
     * @param $tableOutput the target to output the tables to -- i.e., an
     * element to append the tables to
     */ 
    function handleXmlResponse(xml, $tableOutput) {
      var $xml = $(xml);
      var groups = getCatalogGroups($xml);
      createTables($tableOutput, groups);
      populateTables($xml, groups, $tableOutput);
      initializeDataTables($tableOutput);
    }
    
    /**
     * Get the catalog groups from the xml
     * 
     * @param $xml The XML containing catalog groups
     * @return An array of groups of structure 
     *    { name: [Catalog Group Name], id: [html id]}
     */
    function getCatalogGroups($xml) {
      var groups = Array();
      var names = Array();
      $xml.find('item catalogGroup').each(function(index, value) {
        var group = $(value).text();
        if (names.indexOf(group) != -1) {
	    return;
        }
        
        // Generate an id value for the HTML <table> tags
        var tableId = group.toLowerCase().split(" ").join('-');
        groups.push({ name: group, id: tableId });
        names.push(group);
      });
      return groups;
    }
    
    /**
     * Create table stubs for the various catalog groups
     * 
     * @param $appendTo The output to append the HTML table
     * @param groups The Groups array of objects
     */
    function createTables($appendTo, groups) {
      for (var i = 0, size = groups.length; i < size; i++) {
	$appendTo.append('<table id="' + groups[i].id + '" class="display">'
			+ '<thead>'
			+     '<tr>'
                        +       '<th colspan="5">' + groups[i].name + '</th>'
			+     '</tr>'
			+     '<tr>'
			+         '<th>Part Number</th>'
			+         '<th>Manufacturer</th>'
			+         '<th>Catalog Name</th>'
			+         '<th>Sales Price</th>'
			+         '<th>Upgrade Fee*</th>'
			+     '</tr>'
			+ '</thead>'
			+ '<tbody>'
			+ '</tbody>'
                        +'</table>'
	);
      }
    }
    
    /**
     * Populate the catalog group tables with their items
     * 
     * @param $xml The jQuery wrapped object of the XML
     * @param groups The array of Group objects
     * @param $tables The DOM element containing all of the Catalog Group tables that will
     * have rows appended to
     */
    function populateTables($xml, groups, $tables) {
	for (var i = 0, size = groups.length; i < size; i++) {
            $xml.find("item catalogGroup:textEquals(" + groups[i].name + ")").each(function() {
		var item = $(this).parent();
		
		// assign variables to the values of the catalogGroup tag's siblings
		var partNumber = item.find('partNumber').text(),
		manufacturer = item.find('manufacturer').text(),
		catalogName = item.find('catalogName').text(),
		salesPrice = specialFormatSP( item.find('salesPrice').text() ),
		upgradeFee = specialFormatUF( item.find('upgradeFee').text() );
		
                
		$tables.find('#' + groups[i].id + " tbody").append(
                    "<tr>" 
                    + "<td>" + partNumber + "</td>"
                    + "<td>" + manufacturer + "</td>"
		    + "<td>" + catalogName + "</td>"
		    + "<td>" + salesPrice + "</td>"
		    + "<td>" + upgradeFee + "</td>"
		    + "</tr>"
		    );
	    });
	}
    }
    
    /**
     * Initialize jQuery DataTables on the tables contained within the provided object
     * 
     * @param $tables The DOM element containing all of the tables
     */
    function initializeDataTables($tables) {
    	$tables.find("table").each(function() {
            $(this).dataTable( {
                "bFilter": false,
                "bPaginate": false,
                "bInfo": false,
                "aoColumns": [
                    null,
                    null,
                    null,
                    { "sType": "price" },
                    { "sType": "price" }
                ]
            });
    	});
    }
    
    /**
     * Format the salesPrice String variable to display values
     * in the form of $99 if it is a whole number and in the
     * form of $99.99 if in the form of a decimal number.
     *
     * @param {String} salesPriceParam the salesPrice variable
     *        passed from makeDataTables(groupsArray,
     *        tableIdsArrayParam);
     */
    function specialFormatSP(salesPriceParam) {
        if (salesPriceParam.length > 0) {
            salesPriceParam = "$" + salesPriceParam;
            
            var periodIndex = salesPriceParam.indexOf(".");
            if (salesPriceParam.substr(periodIndex).length == 2) {
                salesPriceParam = salesPriceParam + "0";
            }
        }
        return salesPriceParam;
    }
    
    /**
     * Format the upgradeFee String variable to display "N/A"
     * if there is no value for that item in the xml catalog.
     *
     * @param {String} upgradeFeeParam the upgradeFee variable
     *        passed from makeDataTables(groupsArray,
     *        tableIdsArrayParam);
     */
    function specialFormatUF(upgradeFeeParam) {
        if (upgradeFeeParam.length > 0) {
            upgradeFeeParam = "$" + upgradeFeeParam;
        }
        else if (upgradeFeeParam.length == 0) {
            upgradeFeeParam = "N/A";
        }
        return upgradeFeeParam
    }
    
    /**
     * Add a loading message that gets removed after the AJAX call
     * 
     * @param $addAfter The element to add the footnotes after -- i.e.,
     * #tables-wrapper
     */
    function addLoadingMessage($addAfter) {
        $addAfter.after('<p id="loading-message">Loading...</p>');
        $(document).ajaxStop(function() {
            $('#loading-message').css('display', 'none');
        });
    }
    
    /**
     * Add footnotes after the div that wraps the tables -- i.e.,
     * #tables-wrapper -- and display them after the AJAX call
     * 
     * @param $addAfter The element to add the footnotes after -- i.e.,
     * #tables-wrapper
     */
    function addFootnotes($addAfter) {
        $addAfter.after(
            '<p class="footnote">* The 9611g is the standard model'
            + 'telephone that will be provided'
            + 'as a replacement to all existing ROLM telephones as part of the'
            + 'campus-wide unified communications project.</p>'
            + '<p class="footnote">** Please note that the appropriate'
            + 'Electronic Hook Switch for your phone type is required for full'
            + 'functionality of the Jabra headsets</p>'
        );
        $(document).ajaxStop(function() {
           $('.footnote').css('display', 'block'); 
        });
    }
    
})(jQuery);