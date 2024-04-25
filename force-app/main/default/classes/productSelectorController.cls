public with sharing class productSelectorController {
    //controller class for LWC TESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTINGTESTING
    @AuraEnabled
            public static ContextDefinition geContextDefinition(string contextDefinitionName){
                ContextDefinition cd = [SELECT Id, DeveloperName FROM ContextDefinition WHERE DeveloperName=:contextDefinitionName limit 1];
                return cd; }
    @AuraEnabled
            public static AttributeWrapper getAttributeAdjustments(string productId, string quoteId){
                Quote q = [SELECT Id,Name,Pricebook2Id FROM Quote WHERE id=:quoteId limit 1];     
                list<AttributeAdjustmentCondition> listAttributeAdjConidition = [select product.name , attributedefinition.name, stringvalue, AttributeBasedAdjRuleId , 
                    AttributeBasedAdjRule.name, operator, productid from AttributeAdjustmentCondition  where ProductId=:productId ];
                list<id> listruleId = new list<id>();
                for (AttributeAdjustmentCondition a:listAttributeAdjConidition){ listruleId.add(a.AttributeBasedAdjRuleId); }
                list<AttributeBasedAdjustment> listAttributeAdj =   [select AttributeBasedAdjRuleId, AdjustmentType , AdjustmentValue , AttributeBasedAdjRule.Name from AttributeBasedAdjustment 
                where AttributeBasedAdjRuleId in :listruleId];
                AttributeWrapper awrap = new AttributeWrapper(listAttributeAdj,listAttributeAdjConidition );
                return awrap; }
    @AuraEnabled
            public static List<PriceAdjustmentTier> getPriceAdjustmentTiers(string productId, string quoteId){
                list<PriceAdjustmentTier> l = [  select id, name, tiertype, tiervalue , 
                    lowerbound, upperbound, product2.name, product2.id  from PriceAdjustmentTier
                    where product2id=:productId];
                    //system.debug(l);
                return l;}
    @AuraEnabled
                public static list<pricebookentry> getPrices(string catalogId, string quoteId){
                    list<id> listofProds = new list<id>();
                    Quote q = [SELECT Id,Name,Pricebook2Id FROM Quote WHERE id=:quoteId limit 1];
                    list<ProductCategoryProduct> listPriductCategory = [select ProductId from ProductCategoryProduct  where ProductCategoryId in (select id from ProductCategory where CAtalogid =:catalogId)];
                    for (ProductCategoryProduct p:listPriductCategory){ listofProds.add(p.ProductId); }
                    list<pricebookentry> listPBEs = [select Id,Product2Id, UnitPrice from pricebookentry where product2Id in:listofProds and pricebook2id =:q.Pricebook2Id];
                    return listPBEs; }
    @AuraEnabled
            public static string getProductsFromCatalog(string catalogName){
                ProductCatalog pc = [SELECT Id, Name FROM ProductCatalog WHERE name=:catalogName limit 1];
                //string postBody ='{"correlationId": "corrId","catalogId":"' + pc.id + '"}';
                string postBody ='{"catalogIds":["' + pc.id + '"]}';
                PageReference visualforcePage = new PageReference('/apex/sessionId' );
                String content = visualforcePage.getContent().toString();
                Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
                Integer e = content.indexOf('End_Of_Session_Id');
                string sessionId = content.substring(s, e);
                HTTP h = new HTTP();
                HTTPRequest req = new HTTPRequest();
                HttpResponse resp = new HttpResponse();
                req.setMethod('POST');
                req.setHeader('Authorization', 'Bearer ' + sessionId);
                req.setHeader('Accept', 'application/json');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(postBody);
                //req.setEndpoint('https://dborlmtraining.my.salesforce.com/services/data/v60.0/connect/cpq/products');
                req.setEndpoint('https://dborlmtraining.my.salesforce.com/services/data/v60.0/connect/pcm/products');
                resp = h.send(req);
                return resp.getBody(); }
    @AuraEnabled
            public static string getQuotePrice(string quoteId, 
            integer quantity, string productId, Decimal price, string psmId, string PricebookEntryId){
                Quote q = [SELECT Id, Name , Pricebook2Id FROM Quote WHERE id=:quoteId limit 1];
                pricebookentry pbe = [select Id ,UnitPrice from pricebookentry 
                                            where Pricebook2Id =:q.Pricebook2Id and
                                            product2Id = :productId and
                                            ProductSellingModelId =:psmId  limit 1 ];
                string postBody =  
                '{"correlationId":"1234567","contextId":"","records":[{"referenceId":"' + quoteId + 
                '", "record":{  "attributes":{  "type":"Quote", "method":"POST"  },  "Name":"' + q.Name + 
                '","Pricebook2Id":"' + q.Pricebook2Id + '"}},{"referenceId":"refQuoteLine",' +
                '"record":{"attributes":{"type":"QuoteLineItem","method":"POST"},' + 
                '"QuoteId":"' + q.Id + '","PricebookEntryId":"' + pbe.Id + 
                '","Product2Id":"' + productId + 
                '","ProductSellingModelId":"' +psmId +
                '","Quantity":' + quantity + 
                ',"UnitPrice":' + pbe.UnitPrice  + '}}]}';
                PageReference visualforcePage = new PageReference('/apex/sessionId' );
                String content = visualforcePage.getContent().toString();
                Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
                Integer e = content.indexOf('End_Of_Session_Id');
                string sessionId = content.substring(s, e);
                HTTP h = new HTTP();
                HTTPRequest req = new HTTPRequest();
                HttpResponse resp = new HttpResponse();
                req.setMethod('POST');
                req.setHeader('Authorization', 'Bearer ' + sessionId);
                req.setHeader('Accept', 'application/json');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(postBody);
                req.setEndpoint('https://dborlmtraining.my.salesforce.com/services/data/v60.0/industries/cpq/quotes/actions/get-instant-price');
                resp = h.send(req);
                return resp.getBody();
            }
    @AuraEnabled
            public static string getProductDetails(string catalogId,  string productId){
                string postBody =  
                '{"catalogId":"' + catalogId + '"}';
                PageReference visualforcePage = new PageReference('/apex/sessionId' );
                String content = visualforcePage.getContent().toString();
                Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
                Integer e = content.indexOf('End_Of_Session_Id');
                string sessionId = content.substring(s, e);
                HTTP h = new HTTP();
                HTTPRequest req = new HTTPRequest();
                HttpResponse resp = new HttpResponse();
                req.setMethod('POST');
                req.setHeader('Authorization', 'Bearer ' + sessionId);
                req.setHeader('Accept', 'application/json');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(postBody);
                req.setEndpoint('https://dborlmtraining.my.salesforce.com/services/data/v60.0/connect/cpq/products/' + productId );
                resp = h.send(req);
                return resp.getBody();}
    public class AttributeWrapper{
        @AuraEnabled public list<AttributeBasedAdjustment>  AttributeAdjustment{get;set;}
        @AuraEnabled public list<AttributeAdjustmentCondition>  AttributeAdjustmentCondition{get;set;}
        public AttributeWrapper(list<AttributeBasedAdjustment>  adjustmentList, list<AttributeAdjustmentCondition>  conditionList){
                        this.AttributeAdjustment = adjustmentList;
                        this.AttributeAdjustmentCondition = conditionList; }}
}