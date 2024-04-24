import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import geContextDefinition from "@salesforce/apex/productSelectorController.geContextDefinition";
import getProductsFromCatalog from "@salesforce/apex/productSelectorController.getProductsFromCatalog";
import getPrices from "@salesforce/apex/productSelectorController.getQuotePrice";
import getProductDetail from "@salesforce/apex/productSelectorController.getProductDetails";
import getPBES from "@salesforce/apex/productSelectorController.getPrices";
import getAttributeAdjustments from "@salesforce/apex/productSelectorController.getAttributeAdjustments";
import getPriceAdjustmentTiers from "@salesforce/apex/productSelectorController.getPriceAdjustmentTiers";
import { RefreshEvent } from 'lightning/refresh';
const attributeColumns = [
    { label: 'optionName', fieldName: 'optionName' },
    { label: 'attributedefinitionID', fieldName: 'attributedefinitionID' },
    { label: 'SelectedAttributePicklistValueId', fieldName: 'SelectedAttributePicklistValueId' },
];
const columns = [
    { label: 'Category', fieldName: 'categoryName' },
    { label: 'Product', fieldName: 'ProductName' },
    { label: 'Description', fieldName: 'Description' },
    { label: 'Price (€)', fieldName: 'Price' },
];
const adjcolumns2 = [
    { label: 'ProductName', fieldName: 'ProductName' },
    { label: 'AttributeDefinitionName', fieldName: 'AttributeDefinitionName' },
    { label: 'Operator', fieldName: 'Operator' },
    { label: 'StringValue', fieldName: 'StringValue' },
    { label: 'CriteriaMet', fieldName: 'CriteriaMet' },
];
const voladjcolumns = [
    { label: 'ProductName', fieldName: 'ProductName' },
    { label: 'TierType', fieldName: 'TierType' },
    { label: 'TierValue', fieldName: 'TierValue' },
    { label: 'LowerBound', fieldName: 'LowerBound' },
    { label: 'UpperBound', fieldName: 'UpperBound' },
    { label: 'Name', fieldName: 'Name' },
    { label: 'CriteriaMet', fieldName: 'CriteriaMet' },
];
export default class ProductSelector extends NavigationMixin(LightningElement) {
    optionGroupList;volpriceadjustments=[];selectedAttributeValues=[]
    showContextDefinition = false; showProducts = false; showPricing = false; showConfig = false; showOptions = false;
    attributeColumns=attributeColumns;columns = columns;
    //adjcolumns = adjcolumns;
     adjcolumns2=adjcolumns2; voladjcolumns=voladjcolumns;
    pricingResultQLI; selectProduct; selectProductId = ''; selectedProductData;
    draftValues = []; selectedQuantity = 0; pricingData = ''; contextDefinitionName = 'FBCDSalesTransactionContext';
    catalogName = 'DB Hardware Catalog'; catalogId = '0ZS0600000115LCGAY'; contextDefId = '';
    productData = ''; productDataJSON; productList = []; prodListFull = [];pbeList=[];attributeAdjustmentList=[];attributeAdjustmentParentList=[];
    @api SectionTitle; @api recordId; @api Icon; @api IconSize;
    connectedCallback() { this.getContext(); this.getPriceBookEntries();}
    getContext() {
        geContextDefinition({ contextDefinitionName: this.contextDefinitionName })
            .then((result) => {
                this.contextDefId = result.Id;
                this.showContextDefinition = true; })
            .catch((error) => { console.log(error); }); }
//get the products and prices from the Catalog (1st Step)
    getPriceBookEntries() {
        getPBES({ catalogId: this.catalogId, quoteId:this.recordId })
            .then((result) => { this.pbeList = result; this.getProducts();})
            .catch((error) => { console.log(error); });}
    getProducts() {
        getProductsFromCatalog({ catalogName: this.catalogName })
            .then((result) => {
                this.productData = result;
                const obj = JSON.parse(this.productData);
                var listprods = obj.products;
                for (let i = 0; i < listprods.length; i++) {
                    let o = JSON.parse(JSON.stringify(listprods[i]));
                    this.prodListFull.push(o);
                    let product = {
                        'id:': listprods[i].id,
                        'categoryId': listprods[i].categories[0].id,
                        'categoryName': listprods[i].categories[0].name,
                        'ProductName': listprods[i].name,
                        'Description': listprods[i].description,
                        'displayUrl': listprods[i].displayUrl,
                        'ProductId': listprods[i].id};
                    if (listprods[i].productSellingModelOptions[0]) { 
                        product.pricingModel = listprods[i].productSellingModelOptions[0].productSellingModel.id;}
                    this.productList.push(product);}
                for (let i = 0; i < this.prodListFull.length; i++) {
                    for (let j = 0; j < this.pbeList.length; j++) {
                        if(this.pbeList[j].Product2Id == this.prodListFull[i].id)  {
                            this.prodListFull[i].price = this.pbeList[j].UnitPrice; } } }
                for (let i = 0; i < this.productList.length; i++) {
                    for (let j = 0; j < this.pbeList.length; j++) {
                        if(this.pbeList[j].Product2Id == this.productList[i].ProductId)  {
                            this.productList[i].Price = this.pbeList[j].UnitPrice; } } }
                this.showProducts = true;
            })
            .catch((error) => { console.log(error); });
    }
//once product is selected get the configuration details (2nd Step)
    getSelectedProductDetails() {
        getProductDetail({ catalogId: this.catalogId, productId: this.selectProductId })
            .then((result) => {
                const obj = JSON.parse(result);
                this.selectedProductData = obj.result.attributeCategories;
                let optionGroupList = []
                for (let i = 0; i < this.selectedProductData.length; i++) {
                    let optionGroup = {}; let options = [];
                    optionGroup.Name = this.selectedProductData[i].name;
                    for (let j = 0; j < this.selectedProductData[i].records.length; j++) {
                        let option = {
                            'optionName': this.selectedProductData[i].records[j].attributeNameOverride,
                            'defaultValue': this.selectedProductData[i].records[j].defaultValue,
                            'attributedefinitionID' : this.selectedProductData[i].records[j].id,
                        };
                        if (this.selectedProductData[i].records[j].dataType == 'PICKLIST') {
                            let picklistoptions = [];
                            for (let k = 0; k < this.selectedProductData[i].records[j].attributePickList.values.length; k++) {
                                picklistoptions.push({
                                    'label': this.selectedProductData[i].records[j].attributePickList.values[k].displayValue,
                                    'value': this.selectedProductData[i].records[j].attributePickList.values[k].id
                                });
                            }
                            option.picklistoptions = picklistoptions;
                        }
                        options.push(option);
                    }
                    optionGroup.options = options
                    optionGroupList.push(optionGroup);
                }
                this.optionGroupList = optionGroupList;
                this.showOptions = true;
            })
            .catch((error) => { console.log(error); });
    }
getSelectedProductAttributeAdj() {
    getAttributeAdjustments({ productId: this.selectProductId,quoteId: this.recordId })
            .then((result) => {
                let attributeAdjustment = result.AttributeAdjustment; let attributeConidition = result.AttributeAdjustmentCondition;
                for (let i = 0; i < attributeAdjustment.length; i++) {
                    let attribparent = {};
                    attribparent.Id = attributeAdjustment[i].Id;
                    attribparent.RuleId = attributeAdjustment[i].AttributeBasedAdjRuleId;
                    attribparent.RuleName = attributeAdjustment[i].AttributeBasedAdjRule.Name;
                    attribparent.AdjustmentType = attributeAdjustment[i].AdjustmentType;
                    attribparent.AdjustmentValue = attributeAdjustment[i].AdjustmentValue;
                    attribparent.Contribs = [];
                    for (let j = 0; j < attributeConidition.length; j++) {
                        let attribContrib = {};
                        attribContrib.CriteriaMet =false;
                        attribContrib.Id = attributeConidition[j].Id;
                        attribContrib.ProductName = attributeConidition[j].Product.Name;
                        attribContrib.AttributeDefinitionId = attributeConidition[j].AttributeDefinitionId;
                        attribContrib.AttributeDefinitionName = attributeConidition[j].AttributeDefinition.Name;
                        attribContrib.AttributeBasedAdjRuleId = attributeConidition[j].AttributeBasedAdjRuleId;
                        attribContrib.Operator = attributeConidition[j].Operator;
                        attribContrib.StringValue = attributeConidition[j].StringValue;
                        if(attribContrib.AttributeBasedAdjRuleId ==attribparent.RuleId  )
                        {attribparent.Contribs.push(attribContrib);}    
                    }
                    this.attributeAdjustmentParentList.push(attribparent);
                }
            })
            .catch((error) => { console.log(error); }); }
 getSelectedProductPriceAdj() {
        getPriceAdjustmentTiers({ productId: this.selectProductId,quoteId: this.recordId })
            .then((result) => {
                let res = result;
                for (let j = 0; j < res.length; j++) {
                    let obj =JSON.parse(JSON.stringify(res[j]));
                    obj.ProductName = obj.Product2.Name;
                    obj.CriteriaMet = false;
                    this.volpriceadjustments.push(obj); }})
            .catch((error) => { console.log(error); });}
//once product is selected get the price details (nb - this ignores  the config for now)
    getPriceforSelected() {
        getPrices({
            quoteId: this.recordId,
            quantity: this.selectedQuantity,
            productId: this.selectProduct.ProductId,
            quoteId: this.recordId,
            price:0,
            psmId: this.selectProduct.pricingModel,
            PricebookEntryId:''
        })
            .then((result) => {
                this.pricingData = result;
                const obj = JSON.parse(this.pricingData);
                for (let i = 0; i < obj.records.length; i++) {
                    if (obj.records[i].record.attributes.type == 'QuoteLineItem') {
                        let price = {};
                        if (obj.records[i].record.NetUnitPrice) { price.NetUnitPrice = obj.records[i].record.NetUnitPrice; }
                        if (obj.records[i].record.NetTotalPrice) { price.NetTotalPrice = obj.records[i].record.NetTotalPrice; }
                        if (obj.records[i].record.ListPrice) { price.ListPrice = obj.records[i].record.ListPrice; }
                        if (obj.records[i].record.TotalAdjustmentAmount) { price.TotalAdjustmentAmount = obj.records[i].record.TotalAdjustmentAmount; }
                        this.pricingResultQLI = price;
                    }
                }
                this.showPricing = true;
            })
            .catch((error) => { console.log(error); });
    }
    getSelectedProduct(event) {
        const selectedRows = event.detail.selectedRows;
        for (let i = 0; i < selectedRows.length; i++) {
            this.selectProduct = selectedRows[i];
            this.selectProductId = selectedRows[i].ProductId;
            this.showConfig = true;
            this.showProducts = false;
        }
        this.getSelectedProductDetails();this.getSelectedProductAttributeAdj();this.getSelectedProductPriceAdj();
    }
    selectProductfromCard(event) {
        this.selectProductId = event.target.dataset.id;
        this.showConfig = true;
        this.showProducts = false;
        for (let i = 0; i < this.productList.length; i++) { if (this.productList[i].ProductId == event.target.dataset.id) { this.selectProduct = this.productList[i]; } }
        this.getSelectedProductDetails();this.getSelectedProductAttributeAdj();this.getSelectedProductPriceAdj();
    }
    handleQuantityChange(e) { 
        this.selectedQuantity = e.detail.value;
        for (let i = 0; i <  this.volpriceadjustments.length; i++) {
            if(this.volpriceadjustments[i].LowerBound <= this.selectedQuantity && this.volpriceadjustments[i].UpperBound >= this.selectedQuantity) {this.volpriceadjustments[i].CriteriaMet = true;}
        else{ this.volpriceadjustments[i].CriteriaMet = false;}}
        let x = JSON.parse(JSON.stringify( this.volpriceadjustments));
        this.volpriceadjustments = [];
        this.volpriceadjustments = x;
        this.dispatchEvent(new RefreshEvent());}
    getPrice(event) { this.getPriceforSelected(); }
    handleOptionChange(event) {
        let userselection = {};
        let selectedLabel = event.target.options.find(opt => opt.value === event.detail.value).label;
        userselection.attributedefinitionID = event.target.dataset.id;
        userselection.SelectedAttributePicklistValueId = event.detail.value;
        userselection.SelectedAttributePicklistValue = selectedLabel;
        for (let i = 0; i <  this.optionGroupList.length; i++) {
            for (let j = 0; j <  this.optionGroupList[i].options.length; j++) {
                if( this.optionGroupList[i].options[j].attributedefinitionID == event.target.dataset.id) {
                    userselection.optionName = this.optionGroupList[i].options[j].optionName;
                    break;}}}
        let addUserSelection = true
        for (let i = 0; i <  this.selectedAttributeValues.length; i++) {
            if(this.selectedAttributeValues[i].attributedefinitionID == userselection.attributedefinitionID){
                this.selectedAttributeValues[i].SelectedAttributePicklistValueId = userselection.SelectedAttributePicklistValueId;
                this.selectedAttributeValues[i].SelectedAttributePicklistValue = userselection.SelectedAttributePicklistValue;
                addUserSelection = false;}}
        if(addUserSelection){ this.selectedAttributeValues.push(userselection);}
        let x = JSON.parse(JSON.stringify(this.selectedAttributeValues));
        this.selectedAttributeValues=[];this.selectedAttributeValues=x;
        this.dispatchEvent(new RefreshEvent());
        for(  let i = 0; i <  this.attributeAdjustmentParentList.length; i++) {
            let numberofCriteria = this.attributeAdjustmentParentList[i].Contribs.length;
            let numberofCriteriaMet = 0;
                for (let j=0; j< this.attributeAdjustmentParentList[i].Contribs.length; j++){
                    for (let k=0; k< this.selectedAttributeValues.length; k++){
                    if(this.selectedAttributeValues[k].SelectedAttributePicklistValue ==  this.attributeAdjustmentParentList[i].Contribs[j].StringValue &&
                    this.selectedAttributeValues[k].attributedefinitionID == this.attributeAdjustmentParentList[i].Contribs[j].AttributeDefinitionId)
                        { this.attributeAdjustmentParentList[i].Contribs[j].CriteriaMet = true; numberofCriteriaMet = numberofCriteriaMet +1; }
                    if( this.selectedAttributeValues[k].SelectedAttributePicklistValue!=  this.attributeAdjustmentParentList[i].Contribs[j].StringValue &&
                        this.selectedAttributeValues[k].attributedefinitionID == this.attributeAdjustmentParentList[i].Contribs[j].AttributeDefinitionId)
                        { this.attributeAdjustmentParentList[i].Contribs[j].CriteriaMet = false; numberofCriteriaMet = numberofCriteriaMet -1;} }}
        if(numberofCriteriaMet == numberofCriteria){this.attributeAdjustmentParentList[i].RuleMet =true;}}
        //add check for whether all attributes are true
        for(  let i = 0; i <  this.attributeAdjustmentParentList.length; i++) {
            let checkRule = true;
            for (let j=0; j< this.attributeAdjustmentParentList[i].Contribs.length; j++){
                if( this.attributeAdjustmentParentList[i].Contribs[j].CriteriaMet === false)  {  
                    checkRule = false; 
                    this.attributeAdjustmentParentList[i].RuleMet = checkRule; } } }
        let y = JSON.parse(JSON.stringify(this.attributeAdjustmentParentList));
        this.attributeAdjustmentParentList = [];
        this.attributeAdjustmentParentList = y;
        this.dispatchEvent(new RefreshEvent());}
    goBack() { 
        this.showConfig = false; this.showPricing = false; this.showProducts = true;
        this.attributeAdjustmentParentList=[];
        this.volpriceadjustments=[];
        this.selectedAttributeValues=[];
        this.pricingResultQLI={}; }
}