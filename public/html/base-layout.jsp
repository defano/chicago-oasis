<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib uri="http://java.sun.com/jstl/fmt" prefix="fmt"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form"%>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles"%>
<html>
<head>
<tiles:useAttribute name="cssFiles" />
<tiles:useAttribute name="jsFiles" />
<c:forEach var="cssInclude" items="${cssFiles}">
    <link rel="stylesheet" type="text/css" href="${cssInclude}">
</c:forEach>
<c:forEach var="jsInclude" items="${jsFiles}">
    <script type="text/javascript" src="${jsInclude}"></script>
</c:forEach>
<title><tiles:getAsString name="title" /></title>
</head>
<body>
    <tiles:insertAttribute name="header" />
    <tiles:insertAttribute name="body" />
    <tiles:insertAttribute name="footer" />    
</body>
</html>
