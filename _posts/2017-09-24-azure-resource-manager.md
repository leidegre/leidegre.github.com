---
title: Azure Resource Manger (ARM)
lead: What is the Azure Resource Manager and how do you use it?
layout: post
---

The Azure Resource Manger looks to be the public API for Azure. It is to Azure what the Win32 `CreateFile` API is to Windows. Whatever you need to in Azure, there's a Resource Manager (RM) API for it.

A possibly lesser known way to browse Azure is throught the https://resources.azure.com/ resource explorer. It's an enorumous tree which offers various ways to access your resources but you can also perform actions through the resouce explorer. All the Azure portal is, is a wrapper around the RM APIs, the same can be said for the Azure PowerShell cmdlets and Azure CLI 2.0 tool. They are all just abstractions built on top of the Azure RM APIs that teaches you a different way of doing things in Azure. The near metal experience is the Azure RM REST APIs. And there's really only one tool which offers a native experience and that is the [ARMClient](https://github.com/projectkudu/ARMClient) which is an unoffical Microsoft tool built by some offical Microsoft [people](https://github.com/projectkudu/ARMClient/graphs/contributors).

I decided to write this post to make sense of all the resources out there. I'm going to use the Azure CLI 2.0 `az` command because it is convinent.

Azure RM has providers, providers have versions, different versions, different capabilities and sometimes even schema. To figure out what is what you can query the RM APIs like this.

    az provider show --namespace Microsoft.Web --query "resourceTypes[*].resourceType"
    [
      "sites/extensions",
      "sites/slots/extensions",
      "sites/instances",
      "sites/slots/instances",
      "sites/instances/extensions",
      "sites/slots/instances/extensions",
      "sites/publicCertificates",
      "sites/slots/publicCertificates",
      "publishingUsers",
      "ishostnameavailable",
      "validate",
      "isusernameavailable",
      "sourceControls",
      "availableStacks",
      "listSitesAssignedToHostName",
      "sites/hostNameBindings",
      "sites/domainOwnershipIdentifiers",
      "sites/slots/hostNameBindings",
      "operations",
      "certificates",
      "serverFarms",
      "serverFarms/workers",
      "sites",
      "sites/slots",
      "runtimes",
      "sites/metrics",
      "sites/metricDefinitions",
      "sites/slots/metrics",
      "sites/slots/metricDefinitions",
      "serverFarms/metrics",
      "serverFarms/metricDefinitions",
      "sites/recommendations",
      "recommendations",
      "georegions",
      "sites/premieraddons",
      "hostingEnvironments",
      "hostingEnvironments/multiRolePools",
      "hostingEnvironments/workerPools",
      "hostingEnvironments/metrics",
      "hostingEnvironments/metricDefinitions",
      "hostingEnvironments/multiRolePools/metrics",
      "hostingEnvironments/multiRolePools/metricDefinitions",
      "hostingEnvironments/workerPools/metrics",
      "hostingEnvironments/workerPools/metricDefinitions",
      "hostingEnvironments/multiRolePools/instances",
      "hostingEnvironments/multiRolePools/instances/metrics",
      "hostingEnvironments/multiRolePools/instances/metricDefinitions",
      "hostingEnvironments/workerPools/instances",
      "hostingEnvironments/workerPools/instances/metrics",
      "hostingEnvironments/workerPools/instances/metricDefinitions",
      "deploymentLocations",
      "functions",
      "deletedSites",
      "ishostingenvironmentnameavailable",
      "classicMobileServices",
      "connections",
      "customApis",
      "locations",
      "locations/managedApis",
      "locations/apiOperations",
      "connectionGateways",
      "locations/connectionGatewayInstallations",
      "checkNameAvailability",
      "billingMeters",
      "verifyHostingEnvironmentVnet"
    ]

It will return a list of resources types that we can use. Too many to go through here but you can drill into each one like this:

    az provider show --namespace Microsoft.Web --query "resourceTypes[?resourceType=='sites'].apiVersions | [0]" --out table
    Result
    ------------------
    2016-08-01
    2016-03-01
    2015-08-01-preview
    2015-08-01
    2015-07-01
    2015-06-01
    2015-05-01
    2015-04-01
    2015-02-01
    2014-11-01
    2014-06-01
    2014-04-01-preview
    2014-04-01
    
Pick an API version you're intrested in exploring and goto the GitHub Azure RM schema repo:

    https://raw.githubusercontent.com/Azure/azure-resource-manager-schemas/master/schemas/2016-08-01/Microsoft.Web.json

For actions you can check the azure-rest-api-specs repo in a similar manner. For example,

    https://raw.githubusercontent.com/Azure/azure-rest-api-specs/current/specification/web/resource-manager/Microsoft.Web/2016-08-01/WebApps.json

Though, I don't know where that `WebApps` name is coming from, in this particular case the repo only has a single JSON file, so it's self evident that it's the right one but itsn't predictable. Here's en example of an operation you can perform. It's a Swagger spec.

~~~
"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/slots/{slot}/slotsswap": {
  "post": {
    "tags": [
      "WebApps"
    ],
    "summary": "Swaps two deployment slots of an app.",
    "description": "Swaps two deployment slots of an app.",
    "operationId": "WebApps_SwapSlotSlot",
    "consumes": [
      "application/json",
      "text/json",
      "application/xml",
      "text/xml",
      "application/x-www-form-urlencoded"
    ],
    "parameters": [
      {
        "$ref": "#/parameters/resourceGroupNameParameter"
      },
      {
        "name": "name",
        "in": "path",
        "description": "Name of the app.",
        "required": true,
        "type": "string"
      },
      {
        "name": "slotSwapEntity",
        "in": "body",
        "description": "JSON object that contains the target slot name. See example.",
        "required": true,
        "schema": {
          "$ref": "#/definitions/CsmSlotEntity"
        }
      },
      {
        "name": "slot",
        "in": "path",
        "description": "Name of the source slot. If a slot is not specified, the production slot is used as the source slot.",
        "required": true,
        "type": "string"
      },
      {
        "$ref": "#/parameters/subscriptionIdParameter"
      },
      {
        "$ref": "#/parameters/apiVersionParameter"
      }
    ],
    "responses": {
      "200": {
        "description": "OK."
      },
      "202": {
        "description": "Operation is in progress."
      }
    },
    "x-ms-long-running-operation": true
  }
}
~~~

Now, I wish there was a more convinent way of navigating these JSON schema files, havent found one but the details are there. What properties you can use and at least a line or two about what it does. You'll have to reverse engineer the rest but at least this is as transparent and low-level as it gets, if you cannot find what you're looking for here, then it cannot be done or there's no API or setting to facilitate what you are looking for.

The Azure resource explorer ties together these two pices of information to build a catalog of everything that is and everything that can be done. While the Azure resource explorer can show you API version information, I'm going to assume it's only showing you the latest really.

An overview of the things outline here for the Azure portal can be found [here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-manager-supported-services).

A final note, the APIs appear to have changed quite a bit over the years. If you look at the resource manager APIs from 2 years ago (2015 era) those are vastly different from the APIs we have now (2017). I have found the more recent APIs to be much better organized and easier to navigate, the schemas appear to be well written, credit to Microsoft for that. If you're using older APIs, I suggest you just upgrade to more recent APIs but be mindful of breakage and test throughly.
