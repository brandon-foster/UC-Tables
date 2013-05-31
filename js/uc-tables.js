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
    
    $(document).ready(function() {            
        $.ajax({
            type: "GET",
            //url: Drupal.settings.basePath + "xsql/atlas/uc_catalog.xsql",
            url: "catalog.xml", // Use for local development
            //url: Drupal.settings.basePath + "xsql/atlas/uc/devices/catalog.xsql",
            dataType: "xml",
            success: function(xml) {
                var catalogXml = $(xml);

                // Empty array of strings that appear in the content of catalog group elements in the XML.
                var groupsArray = [];
                // Used in function makeDataTables(groupsArrayParam, tableIdsArrayParam)
                var tableIdsArray = [];
                makeGroupsArray(catalogXml);
                makeDataTables(groupsArray, tableIdsArray);
                
                
                /**
                 * Populate array groupsArray with each catalog group
                 */
                function makeGroupsArray(xmlFile) {
                    //Populate the groupsArray
                    xmlFile.find('item catalogGroup').each(function(index, value) {
                        var group = $(value).text();
                        
                        // Generate an id value for the HTML <table> tags
                        var tableId = group.toLowerCase().split(" ").join('-');
                        
                        generateHtml(group, tableId);
                    });
                }
                
                /**
                 * Push the group to the groupsArray and its
                 * corresponding tableId to the tableIdsArray if
                 * the group is not found in groupsArray
                 *
                 * @param group The name of the group to be 
                 * @param tableId The id value for the table so the DataTables
                 *        plug-in knows which table manipulate.
                 */
                function generateHtml(group, tableId) {
                    if (groupsArray.indexOf(group) == "-1") {
                        groupsArray.push(group);
                        tableIdsArray.push(tableId);
                        
                        $('#tables-wrapper').append('<table id="' + tableId + '" class="display">'
                                                    + '<thead>'
                                                    +     '<tr>'
                                                    +         '<th colspan="5">' + group + '</th>'
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
                 * Loop through each xml catalogGroup tag and assign
                 * variable references to the values of that tag's siblings.
                 *
                 * @param {String[]} groupsArrayParam array of String values from the
                 *        catalogGroup tags from the xml catalog.
                 * @param {String[]} tableIdsParam array of String generated id values
                 *        to be used for the DataTables plug-in to call
                 *        dataTable() on the appropriate tables.
                 */
                function makeDataTables(groupsArray, tableIdsArrayParam) {
                    for (var i = 0, len = groupsArray.length; i < len; i++) {
                        var groupName = groupsArray[i];
                        catalogXml.find("item catalogGroup:textEquals('" + groupName + "')").each(function(indx) {
                            
                            var item = $(this).parent();
                            
                            // assign variables to the values of the catalogGroup tag's siblings
                            var partNumber = item.find('partNumber').text(),
                                manufacturer = item.find('manufacturer').text(),
                                catalogName = item.find('catalogName').text(),
                                catalogGroup = item.find('catalogGroup').text(),
                                salesPrice = item.find('salesPrice').text(),
                                upgradeFee = item.find('upgradeFee').text();
                            
                            // Special formatting
                            salesPrice = specialFormatSP(salesPrice);
                            upgradeFee = specialFormatUF(upgradeFee);
                            
                            //Get the table with the id generated by the makeGroupsArray function and create a DataTable with columns for
                            // partNumber, manufacturer, catalogDescription, salesprice and upgradefee
                            var table;
                            if (indx == 0) {
                                table = $('#' + tableIdsArray[i]).dataTable({
                                    "bFilter": false,
                                    "bPaginate": false,
                                    "bInfo": false,
                                    "aoColumns": [
                                        null,
                                        null,
                                        null,
                                        { "sType": "html"},
                                        { "sType": "html"}
                                    ]
                                });
                            }
                            else {
                                table = $('#' + tableIdsArray[i]).dataTable();
                            }
                            
                            table.fnAddData([
                                partNumber,
                                manufacturer,
                                catalogName,
                                salesPrice,
                                upgradeFee
                            ]);
                        });
                    }
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
            }
        });
    });
        
})(jQuery);