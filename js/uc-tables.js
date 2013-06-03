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
    
    $.fn.dataTableExt.oSort['price-asc']  = function(a,b) {
        a = (a == "N/A") ? 0 : parseFloat(a.replace('$', ""));
        b = (b == "N/A") ? 0 : parseFloat(b.replace('$', ""));
	return ((a < b) ? -1 : ((a > b) ?  1 : 0));
    };
 
    $.fn.dataTableExt.oSort['price-desc'] = function(a,b) {
        a = (a == "N/A") ? 0 : parseFloat(a.replace('$', ""));
        b = (b == "N/A") ? 0 : parseFloat(b.replace('$', ""));
	return ((a < b) ?  1 : ((a > b) ? -1 : 0));
    };
		
    $(document).ready(function() {            
        $.ajax({
            type: "GET",
            //url: Drupal.settings.basePath + "xsql/atlas/uc_catalog.xsql",
            url: "catalog.xml", // Use for local development
            //url: Drupal.settings.basePath + "xsql/atlas/uc/devices/catalog.xsql",
            dataType: "xml",
            success: function(xml) {
                handleXmlResponse(xml);
                return;
            }
        });
    });
    
    function handleXmlResponse(xml) {
      var $xml = $(xml);
      var $tableOutput = $("#tables-wrapper");
      var groups = getCatalogGroups($xml);
      createTables($tableOutput, groups);
      populateTables($xml, groups, $tableOutput);
      initializeDataTables($tableOutput);
    }
    
    /**
     * Get the catalog groups from the xml
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
     * @param 
     * @param groups The Groups array of objects
     */
    function createTables($appendTo, groups) {
      for (var i = 0, size = groups.length; i < size; i++) {
	$appendTo.append('<table id="' + groups[i].id + '" class="display">'
			+ '<thead>'
			+     '<tr>'
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
    
})(jQuery);