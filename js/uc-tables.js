(function($) {

        /**
         * Create a custom jquery selector :textEquals("string"). It is used in
         * the makeDataTables(String[], String[]) function to find xml tags with text
         * that exactly matches the group names 
         */
        $.expr[':'].textEquals = function(objNode, intStackIndex, arrProperties, arrNodeStack) {
            return $(objNode).text() == arrProperties[3];
        }
        
        /**
         * @author Brandon Foster
         * @version 2013.05.22
         *
         * Dynamically creates HTML tables from the UC Device Pricing XML data.
         */
        $(document).ready(function() {            
            $.ajax({
                type: "GET",
                url: Drupal.settings.basePath + "xsql/atlas/uc_catalog.xsql",
                dataType: "xml",
                success: function(xml) {
                    
                    var catalogXml = $(xml);

                    // Empty array of strings that appear in the content of catalog group elements in the XML.
                    var groupsArray = [];
                    // Used in function makeDataTables(groupsArrayParam, tableIdsArrayParam)
                    var tableIdsArray = [];
                    
                    /**
                     * Loop through each xml catalogGroup tag and assign
                     * variable references to the values of that tag's siblings.
                     *
                     * @param groupsArrayParam array of values from the
                     *       catalogGroup tags from the xml file
                     * @param tableIdsParam array of generated id values to be
                     *       used for calling the dataTable() function on appropriate tables
                     */
                    function makeDataTables(groupsArray, tableIdsArrayParam) {
                        for (var i = 0, len = groupsArray.length; i < len; i++) {
                            var groupName = groupsArray[i];
                            catalogXml.find("item catalogGroup:textEquals('" + groupName + "')").each(function() {
                                
                                var item = $(this).parent();
                                
                                // assign variables to the values of the catalogGroup tag's siblings
                                var partNumber = item.find('partNumber').text(),
                                    manufacturer = item.find('manufacturer').text(),
                                    catalogdescription = item.find('catalogdescription').text(),
                                    catalogGroup = item.find('catalogGroup').text(),
                                    salesprice = item.find('salesprice').text(),
                                    upgradefee = item.find('upgradefee').text();
                                
                                
                                // Dollar sign formatting for number 0 zero
                                if (salesprice.length > 0) {
                                    salesprice = "$ " + salesprice;
                                }
                                if (upgradefee.length > 0) {
                                    upgradefee = "$ " + upgradefee;
                                }
                                else if (upgradefee.length == 0) {
                                    upgradefee = "N/A";
                                }
                                
                                //Get the table with the id generated by the makeGroupsArray function and create a DataTable with columns for
                                // partNumber, manufacturer, catalogDescription, salesprice and upgradefee
                                $('#' + tableIdsArray[i]).dataTable().fnDestroy();
                                var table = $('#' + tableIdsArray[i]).dataTable({
                                        
                                        "bFilter": false,
                                        "bPaginate": false,
                                        "bInfo": false
                                    });
                                
                                table.fnAddData([
                                    partNumber,
                                    manufacturer,
                                    catalogdescription,
                                    salesprice,
                                    upgradefee
                                ]);
                            });
                        }
                    }
                    
                    /**
                     * Populate array groupsArray with each catalog group
                     */
                    function makeGroupsArray(xmlFile) {
                        //Populate the groupsArray
                        xmlFile.find('item catalogGroup').each(function(index, value) {
                            var group = $(value).text();
                            
                            // Generate an id value for the HTML <table> tags
                            var tableId = group.toLowerCase().split(" ").join('-');
                            
                            /**
                             * Push the group to the groupsArray and its
                             * corresponding tableId to the tableIdsArray if
                             * the group is not found in groupsArray
                             */
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
                                                            +         '<th>Catalog Description</th>'
                                                            +         '<th>Sales Price</th>'
                                                            +         '<th>Upgrade Fee*</th>'
                                                            +     '</tr>'
                                                            + '</thead>'
                                                            + '<tbody>'
                                                            + '</tbody>'
                                                         +'</table>'
                                );
                            }
                        });
                    }
                    makeGroupsArray(catalogXml);
                    makeDataTables(groupsArray, tableIdsArray);
                }
            });
            $('tr').mouseover(function() {
                $('this' > 'td').css("background", "#EDEFE6");
            });
        });
        
})(jQuery);